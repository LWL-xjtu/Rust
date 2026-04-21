use axum::{http::StatusCode, Json};
use sqlx::PgPool;

use crate::models::task::{Task, CreateTask, UpdateTask};

pub async fn get_tasks_handler(user_id: i32, pool: &PgPool) -> Result<Json<Vec<Task>>, StatusCode> {
    let task_records = sqlx::query!("SELECT * FROM tasks WHERE user_id = $1", user_id)
        .fetch_all(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    let tasks = task_records.into_iter().map(|record| Task {
        id: record.id,
        title: record.title,
        description: record.description,
        status: record.status.expect("status should not be null"),
        priority: record.priority.expect("priority should not be null"),
        due_date: record.due_date,
        created_at: record.created_at.expect("created_at should not be null"),
        updated_at: record.updated_at.expect("updated_at should not be null"),
        user_id: record.user_id,
        category_id: record.category_id,
    }).collect::<Vec<Task>>();

    Ok(Json(tasks))
}

pub async fn create_task_handler(
    user_id: i32,
    payload: CreateTask,
    pool: &PgPool,
) -> Result<Json<Task>, StatusCode> {
    let task_record = sqlx::query!(
        r#"
        INSERT INTO tasks (title, description, status, priority, due_date, user_id, category_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#,
        payload.title,
        payload.description,
        payload.status.to_string(),
        payload.priority.to_string(),
        payload.due_date,
        user_id,
        payload.category_id
    )
    .fetch_one(pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let task = Task {
        id: task_record.id,
        title: task_record.title,
        description: task_record.description,
        status: task_record.status.expect("status should not be null"),
        priority: task_record.priority.expect("priority should not be null"),
        due_date: task_record.due_date,
        created_at: task_record.created_at.expect("created_at should not be null"),
        updated_at: task_record.updated_at.expect("updated_at should not be null"),
        user_id: task_record.user_id,
        category_id: task_record.category_id,
    };

    // If tag_ids are provided, create task-tag relationships
    if let Some(tag_ids) = payload.tag_ids {
        for tag_id in tag_ids {
            sqlx::query!("INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)", task.id, tag_id)
                .execute(pool)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }
    }

    Ok(Json(task))
}

pub async fn get_task_handler(user_id: i32, id: i32, pool: &PgPool) -> Result<Json<Task>, StatusCode> {
    let task_record = sqlx::query!("SELECT * FROM tasks WHERE id = $1 AND user_id = $2", id, user_id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match task_record {
        Some(record) => {
            let task = Task {
                id: record.id,
                title: record.title,
                description: record.description,
                status: record.status.expect("status should not be null"),
                priority: record.priority.expect("priority should not be null"),
                due_date: record.due_date,
                created_at: record.created_at.expect("created_at should not be null"),
                updated_at: record.updated_at.expect("updated_at should not be null"),
                user_id: record.user_id,
                category_id: record.category_id,
            };
            Ok(Json(task))
        },
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn update_task_handler(
    user_id: i32,
    id: i32,
    payload: UpdateTask,
    pool: &PgPool,
) -> Result<Json<Task>, StatusCode> {
    // Check if task exists and belongs to the user
    let task_exists = sqlx::query!("SELECT id FROM tasks WHERE id = $1 AND user_id = $2", id, user_id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if task_exists.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Update task
    let task_record = sqlx::query!("UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), priority = COALESCE($4, priority), due_date = COALESCE($5, due_date), category_id = COALESCE($6, category_id), updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING id, title, description, status, priority, due_date, created_at, updated_at, user_id, category_id",
        payload.title,
        payload.description,
        payload.status.map(|s| s.to_string()),
        payload.priority.map(|p| p.to_string()),
        payload.due_date,
        payload.category_id,
        id,
        user_id
    )
    .fetch_one(pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Convert to Task struct
    let task = Task {
        id: task_record.id,
        title: task_record.title,
        description: task_record.description,
        status: task_record.status.expect("status should not be null"),
        priority: task_record.priority.expect("priority should not be null"),
        due_date: task_record.due_date,
        created_at: task_record.created_at.expect("created_at should not be null"),
        updated_at: task_record.updated_at.expect("updated_at should not be null"),
        user_id: task_record.user_id,
        category_id: task_record.category_id,
    };

    // Update tags if provided
    if let Some(tag_ids) = payload.tag_ids {
        // Delete existing relationships
        sqlx::query!("DELETE FROM task_tags WHERE task_id = $1", id)
            .execute(pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        // Create new relationships
        for tag_id in tag_ids {
            sqlx::query!("INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)", id, tag_id)
                .execute(pool)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }
    }

    Ok(Json(task))
}

pub async fn delete_task_handler(user_id: i32, id: i32, pool: &PgPool) -> Result<Json<serde_json::Value>, StatusCode> {
    // Check if task exists and belongs to the user
    let task_exists = sqlx::query!("SELECT id FROM tasks WHERE id = $1 AND user_id = $2", id, user_id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if task_exists.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Delete task-tag relationships first
    sqlx::query!("DELETE FROM task_tags WHERE task_id = $1", id)
        .execute(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Delete task
    let result = sqlx::query!("DELETE FROM tasks WHERE id = $1 AND user_id = $2", id, user_id)
        .execute(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(serde_json::json!({
        "message": format!("Success deleted task with id {}", id)
    })))
}