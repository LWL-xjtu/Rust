use uuid::Uuid;

use crate::{
    dto::task::{
        AddTaskProgressLogRequest, CreateTaskRequest, TaskProgressLogResponse, TaskResponse,
        UpdateTaskRequest, UpdateTaskStatusRequest,
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    models::task::{Task, TaskProgressLog},
    services::{activity_service, operation_log_service},
    state::AppState,
};

fn is_valid_task_status(status: &str) -> bool {
    matches!(
        status,
        "pending" | "in_progress" | "completed" | "delayed" | "cancelled"
    )
}

pub async fn create_task(
    state: &AppState,
    auth: &AuthUser,
    req: CreateTaskRequest,
) -> Result<TaskResponse, AppError> {
    activity_service::ensure_activity_manage_access(state, auth, req.activity_id).await?;

    if req.title.trim().is_empty() {
        return Err(AppError::Validation(
            "task title cannot be empty".to_string(),
        ));
    }

    if let Some(assignee) = req.assignee_id {
        let is_member =
            activity_service::activity_member_exists(state, req.activity_id, assignee).await?;
        if !is_member {
            return Err(AppError::Validation(
                "assignee must be an activity member".to_string(),
            ));
        }
    }
    let task = sqlx::query_as::<_, Task>(
        r#"INSERT INTO tasks (id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
           RETURNING id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at"#,
    )
    .bind(Uuid::new_v4())
    .bind(req.activity_id)
    .bind(req.title)
    .bind(req.description)
    .bind(req.assignee_id)
    .bind(auth.0.id)
    .bind(req.priority.unwrap_or_else(|| "medium".to_string()))
    .bind(req.due_time)
    .fetch_one(&state.db)
    .await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(task.activity_id),
        "task",
        Some(task.id),
        "create",
        format!("user {} created task {}", auth.0.username, task.title),
        serde_json::json!({}),
    )
    .await;

    Ok(task.into())
}

pub async fn list_tasks(state: &AppState, auth: &AuthUser) -> Result<Vec<TaskResponse>, AppError> {
    let rows = if auth.0.role == "admin" {
        sqlx::query_as::<_, Task>(
            "SELECT id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at FROM tasks WHERE is_deleted=FALSE ORDER BY created_at DESC",
        )
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Task>(
            r#"SELECT DISTINCT t.id,t.activity_id,t.title,t.description,t.assignee_id,t.creator_id,t.priority,t.due_time,t.status,t.is_deleted,t.created_at,t.updated_at
               FROM tasks t
               LEFT JOIN activities a ON t.activity_id=a.id
               LEFT JOIN activity_members m ON t.activity_id=m.activity_id
               WHERE t.is_deleted=FALSE
                 AND (t.assignee_id=$1 OR t.creator_id=$1 OR a.owner_id=$1 OR m.user_id=$1)
               ORDER BY t.created_at DESC"#,
        )
        .bind(auth.0.id)
        .fetch_all(&state.db)
        .await?
    };
    Ok(rows.into_iter().map(TaskResponse::from).collect())
}

pub async fn get_task(
    state: &AppState,
    auth: &AuthUser,
    task_id: Uuid,
) -> Result<TaskResponse, AppError> {
    let task = sqlx::query_as::<_, Task>(
        "SELECT id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at FROM tasks WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(task_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("task not found".to_string()))?;

    if auth.0.role != "admin" && auth.0.role != "teacher" {
        activity_service::ensure_activity_read_access(state, auth, task.activity_id).await?;
    }
    Ok(task.into())
}

pub async fn update_task(
    state: &AppState,
    auth: &AuthUser,
    task_id: Uuid,
    req: UpdateTaskRequest,
) -> Result<TaskResponse, AppError> {
    let current = sqlx::query_as::<_, Task>(
        "SELECT id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at FROM tasks WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(task_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("task not found".to_string()))?;

    if auth.0.role != "admin" {
        let can_manage = current.creator_id == auth.0.id
            || sqlx::query_scalar::<_, Option<Uuid>>("SELECT owner_id FROM activities WHERE id=$1")
                .bind(current.activity_id)
                .fetch_optional(&state.db)
                .await?
                .flatten()
                == Some(auth.0.id);
        if !can_manage {
            return Err(AppError::Forbidden);
        }
    }

    if let Some(assignee) = req.assignee_id {
        let is_member =
            activity_service::activity_member_exists(state, current.activity_id, assignee).await?;
        if !is_member {
            return Err(AppError::Validation(
                "assignee must be an activity member".to_string(),
            ));
        }
    }
    if let Some(status) = req.status.as_deref() {
        if !is_valid_task_status(status) {
            return Err(AppError::Validation("invalid task status".to_string()));
        }
    }

    let updated = sqlx::query_as::<_, Task>(
        r#"UPDATE tasks SET
              title=$2,
              description=$3,
              assignee_id=$4,
              priority=$5,
              due_time=$6,
              status=$7
            WHERE id=$1
            RETURNING id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at"#,
    )
    .bind(task_id)
    .bind(req.title.unwrap_or(current.title))
    .bind(req.description.or(current.description))
    .bind(req.assignee_id.or(current.assignee_id))
    .bind(req.priority.unwrap_or(current.priority))
    .bind(req.due_time.or(current.due_time))
    .bind(req.status.unwrap_or(current.status))
    .fetch_one(&state.db)
    .await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(updated.activity_id),
        "task",
        Some(updated.id),
        "update",
        format!("user {} updated task {}", auth.0.username, updated.title),
        serde_json::json!({}),
    )
    .await;

    Ok(updated.into())
}

pub async fn delete_task(state: &AppState, auth: &AuthUser, task_id: Uuid) -> Result<(), AppError> {
    let task = sqlx::query_as::<_, Task>(
        "SELECT id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at FROM tasks WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(task_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("task not found".to_string()))?;

    if auth.0.role != "admin" {
        activity_service::ensure_activity_manage_access(state, auth, task.activity_id).await?;
    }

    sqlx::query("UPDATE tasks SET is_deleted=TRUE, status='cancelled' WHERE id=$1")
        .bind(task_id)
        .execute(&state.db)
        .await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(task.activity_id),
        "task",
        Some(task_id),
        "delete",
        format!("user {} deleted task {}", auth.0.username, task.title),
        serde_json::json!({}),
    )
    .await;

    Ok(())
}

pub async fn update_task_status(
    state: &AppState,
    auth: &AuthUser,
    task_id: Uuid,
    req: UpdateTaskStatusRequest,
) -> Result<TaskResponse, AppError> {
    if !is_valid_task_status(&req.status) {
        return Err(AppError::Validation("invalid task status".to_string()));
    }
    let mut tx = state.db.begin().await?;

    let current = sqlx::query_as::<_, Task>(
        "SELECT id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at FROM tasks WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(task_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("task not found".to_string()))?;

    let activity_owner =
        sqlx::query_scalar::<_, Option<Uuid>>("SELECT owner_id FROM activities WHERE id=$1")
            .bind(current.activity_id)
            .fetch_optional(&mut *tx)
            .await?
            .flatten();

    let can_update = auth.0.role == "admin"
        || current.assignee_id == Some(auth.0.id)
        || current.creator_id == auth.0.id
        || activity_owner == Some(auth.0.id);

    if !can_update {
        return Err(AppError::Forbidden);
    }

    let updated = sqlx::query_as::<_, Task>(
        r#"UPDATE tasks SET status=$2 WHERE id=$1
           RETURNING id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at"#,
    )
    .bind(task_id)
    .bind(req.status)
    .fetch_one(&mut *tx)
    .await?;

    let log = sqlx::query_as::<_, TaskProgressLog>(
        r#"INSERT INTO task_progress_logs (id,task_id,user_id,activity_id,old_status,new_status,content)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id,task_id,user_id,activity_id,old_status,new_status,content,created_at"#,
    )
    .bind(Uuid::new_v4())
    .bind(task_id)
    .bind(auth.0.id)
    .bind(current.activity_id)
    .bind(current.status)
    .bind(updated.status.clone())
    .bind(req.comment)
    .fetch_one(&mut *tx)
    .await?;

    let _ = log;
    tx.commit().await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(updated.activity_id),
        "task",
        Some(task_id),
        "status_update",
        format!(
            "user {} changed task {} status to {}",
            auth.0.username, task_id, updated.status
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(updated.into())
}

pub async fn add_progress_log(
    state: &AppState,
    auth: &AuthUser,
    task_id: Uuid,
    req: AddTaskProgressLogRequest,
) -> Result<TaskProgressLogResponse, AppError> {
    let task = sqlx::query_as::<_, Task>(
        "SELECT id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at FROM tasks WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(task_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("task not found".to_string()))?;

    if auth.0.role != "admin" && task.assignee_id != Some(auth.0.id) && task.creator_id != auth.0.id
    {
        return Err(AppError::Forbidden);
    }

    let log = sqlx::query_as::<_, TaskProgressLog>(
        r#"INSERT INTO task_progress_logs (id,task_id,user_id,activity_id,old_status,new_status,content)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id,task_id,user_id,activity_id,old_status,new_status,content,created_at"#,
    )
    .bind(Uuid::new_v4())
    .bind(task_id)
    .bind(auth.0.id)
    .bind(task.activity_id)
    .bind(task.status.clone())
    .bind(task.status)
    .bind(req.content)
    .fetch_one(&state.db)
    .await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(task.activity_id),
        "task_progress_log",
        Some(log.id),
        "add_progress",
        format!(
            "user {} added progress to task {}",
            auth.0.username, task.title
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(log.into())
}

pub async fn list_task_logs(
    state: &AppState,
    auth: &AuthUser,
    task_id: Uuid,
) -> Result<Vec<TaskProgressLogResponse>, AppError> {
    let task = sqlx::query_as::<_, Task>(
        "SELECT id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at FROM tasks WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(task_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("task not found".to_string()))?;

    if auth.0.role != "admin" {
        activity_service::ensure_activity_read_access(state, auth, task.activity_id).await?;
    }

    let rows = sqlx::query_as::<_, TaskProgressLog>(
        "SELECT id,task_id,user_id,activity_id,old_status,new_status,content,created_at FROM task_progress_logs WHERE task_id=$1 ORDER BY created_at DESC",
    )
    .bind(task_id)
    .fetch_all(&state.db)
    .await?;

    Ok(rows
        .into_iter()
        .map(TaskProgressLogResponse::from)
        .collect())
}

pub async fn list_activity_tasks(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
) -> Result<Vec<TaskResponse>, AppError> {
    activity_service::ensure_activity_read_access(state, auth, activity_id).await?;

    let rows = sqlx::query_as::<_, Task>(
        "SELECT id,activity_id,title,description,assignee_id,creator_id,priority,due_time,status,is_deleted,created_at,updated_at FROM tasks WHERE activity_id=$1 AND is_deleted=FALSE ORDER BY created_at DESC",
    )
    .bind(activity_id)
    .fetch_all(&state.db)
    .await?;

    Ok(rows.into_iter().map(TaskResponse::from).collect())
}

#[cfg(test)]
mod tests {
    use super::is_valid_task_status;

    #[test]
    fn accepts_expected_task_statuses() {
        assert!(is_valid_task_status("pending"));
        assert!(is_valid_task_status("in_progress"));
        assert!(is_valid_task_status("completed"));
        assert!(is_valid_task_status("delayed"));
        assert!(is_valid_task_status("cancelled"));
        assert!(!is_valid_task_status("todo"));
        assert!(!is_valid_task_status("done"));
    }
}
