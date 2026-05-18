use uuid::Uuid;

use crate::{
    dto::activity::{
        ActivityMemberResponse, ActivityResponse, AddActivityMemberRequest, CreateActivityRequest,
        UpdateActivityRequest,
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    models::activity::{Activity, ActivityMember},
    services::operation_log_service,
    state::AppState,
};

fn has_manage_privilege(role: &str, owner_id: Uuid, user_id: Uuid) -> bool {
    role == "admin" || role == "teacher" || owner_id == user_id
}

pub async fn create_activity(
    state: &AppState,
    auth: &AuthUser,
    req: CreateActivityRequest,
) -> Result<ActivityResponse, AppError> {
    if req.title.trim().is_empty() {
        return Err(AppError::Validation("title cannot be empty".to_string()));
    }

    let id = Uuid::new_v4();
    let activity_type = req.activity_type.unwrap_or_else(|| "general".to_string());

    let mut tx = state.db.begin().await?;

    let activity = sqlx::query_as::<_, Activity>(
        r#"INSERT INTO activities (id,title,description,activity_type,owner_id,start_time,end_time,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'draft')
           RETURNING id,title,description,activity_type,owner_id,start_time,end_time,status,is_deleted,created_at,updated_at"#,
    )
    .bind(id)
    .bind(req.title)
    .bind(req.description)
    .bind(activity_type)
    .bind(auth.0.id)
    .bind(req.start_time)
    .bind(req.end_time)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query(
        r#"INSERT INTO activity_members (id,activity_id,user_id,member_role)
           VALUES ($1,$2,$3,'owner')"#,
    )
    .bind(Uuid::new_v4())
    .bind(activity.id)
    .bind(auth.0.id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(activity.id),
        "activity",
        Some(activity.id),
        "create",
        format!(
            "user {} created activity {}",
            auth.0.username, activity.title
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(activity.into())
}

pub async fn list_activities(
    state: &AppState,
    auth: &AuthUser,
) -> Result<Vec<ActivityResponse>, AppError> {
    let rows = if auth.0.role == "admin" {
        sqlx::query_as::<_, Activity>(
            r#"SELECT id,title,description,activity_type,owner_id,start_time,end_time,status,is_deleted,created_at,updated_at
               FROM activities WHERE is_deleted=FALSE ORDER BY created_at DESC"#,
        )
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, Activity>(
            r#"SELECT DISTINCT a.id,a.title,a.description,a.activity_type,a.owner_id,a.start_time,a.end_time,a.status,a.is_deleted,a.created_at,a.updated_at
               FROM activities a
               LEFT JOIN activity_members m ON a.id = m.activity_id
               WHERE a.is_deleted=FALSE AND (a.owner_id=$1 OR m.user_id=$1)
               ORDER BY a.created_at DESC"#,
        )
        .bind(auth.0.id)
        .fetch_all(&state.db)
        .await?
    };

    Ok(rows.into_iter().map(ActivityResponse::from).collect())
}

pub async fn get_activity(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
) -> Result<ActivityResponse, AppError> {
    let activity = sqlx::query_as::<_, Activity>(
        r#"SELECT id,title,description,activity_type,owner_id,start_time,end_time,status,is_deleted,created_at,updated_at
           FROM activities WHERE id=$1 AND is_deleted=FALSE"#,
    )
    .bind(activity_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("activity not found".to_string()))?;

    ensure_activity_read_access(state, auth, activity_id).await?;
    Ok(activity.into())
}

pub async fn update_activity(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
    req: UpdateActivityRequest,
) -> Result<ActivityResponse, AppError> {
    ensure_activity_manage_access(state, auth, activity_id).await?;

    let current = sqlx::query_as::<_, Activity>(
        r#"SELECT id,title,description,activity_type,owner_id,start_time,end_time,status,is_deleted,created_at,updated_at
           FROM activities WHERE id=$1 AND is_deleted=FALSE"#,
    )
    .bind(activity_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("activity not found".to_string()))?;

    let updated = sqlx::query_as::<_, Activity>(
        r#"UPDATE activities
           SET title=$2, description=$3, activity_type=$4, start_time=$5, end_time=$6, status=$7
           WHERE id=$1
           RETURNING id,title,description,activity_type,owner_id,start_time,end_time,status,is_deleted,created_at,updated_at"#,
    )
    .bind(activity_id)
    .bind(req.title.unwrap_or(current.title))
    .bind(req.description.or(current.description))
    .bind(req.activity_type.unwrap_or(current.activity_type))
    .bind(req.start_time.or(current.start_time))
    .bind(req.end_time.or(current.end_time))
    .bind(req.status.unwrap_or(current.status))
    .fetch_one(&state.db)
    .await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(activity_id),
        "activity",
        Some(activity_id),
        "update",
        format!(
            "user {} updated activity {}",
            auth.0.username, updated.title
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(updated.into())
}

pub async fn delete_activity(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
) -> Result<(), AppError> {
    ensure_activity_manage_access(state, auth, activity_id).await?;

    let affected = sqlx::query("UPDATE activities SET is_deleted=TRUE, status='cancelled' WHERE id=$1 AND is_deleted=FALSE")
        .bind(activity_id)
        .execute(&state.db)
        .await?
        .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("activity not found".to_string()));
    }

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(activity_id),
        "activity",
        Some(activity_id),
        "delete",
        format!("user {} deleted activity {}", auth.0.username, activity_id),
        serde_json::json!({}),
    )
    .await;

    Ok(())
}

pub async fn list_members(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
) -> Result<Vec<ActivityMemberResponse>, AppError> {
    ensure_activity_read_access(state, auth, activity_id).await?;

    let rows = sqlx::query_as::<_, ActivityMember>(
        r#"SELECT id,activity_id,user_id,member_role,joined_at
           FROM activity_members WHERE activity_id=$1
           ORDER BY joined_at ASC"#,
    )
    .bind(activity_id)
    .fetch_all(&state.db)
    .await?;

    Ok(rows.into_iter().map(ActivityMemberResponse::from).collect())
}

pub async fn add_member(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
    req: AddActivityMemberRequest,
) -> Result<ActivityMemberResponse, AppError> {
    ensure_activity_manage_access(state, auth, activity_id).await?;
    let user_exists: Option<bool> =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM users WHERE id=$1)")
            .bind(req.user_id)
            .fetch_optional(&state.db)
            .await?;
    if !user_exists.unwrap_or(false) {
        return Err(AppError::NotFound("user not found".to_string()));
    }

    let member = sqlx::query_as::<_, ActivityMember>(
        r#"INSERT INTO activity_members (id,activity_id,user_id,member_role)
           VALUES ($1,$2,$3,$4)
           RETURNING id,activity_id,user_id,member_role,joined_at"#,
    )
    .bind(Uuid::new_v4())
    .bind(activity_id)
    .bind(req.user_id)
    .bind(req.member_role.unwrap_or_else(|| "member".to_string()))
    .fetch_one(&state.db)
    .await
    .map_err(|e| match &e {
        sqlx::Error::Database(db_err)
            if db_err.constraint() == Some("activity_members_activity_id_user_id_key") =>
        {
            AppError::Conflict("member already exists".to_string())
        }
        _ => AppError::from(e),
    })?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(activity_id),
        "activity_member",
        Some(req.user_id),
        "add_member",
        format!(
            "user {} added member {} to activity {}",
            auth.0.username, req.user_id, activity_id
        ),
        serde_json::json!({ "member_role": member.member_role }),
    )
    .await;

    Ok(member.into())
}

pub async fn remove_member(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    ensure_activity_manage_access(state, auth, activity_id).await?;

    let activity_owner: Option<Uuid> =
        sqlx::query_scalar("SELECT owner_id FROM activities WHERE id=$1")
            .bind(activity_id)
            .fetch_optional(&state.db)
            .await?;

    if activity_owner == Some(user_id) {
        return Err(AppError::Validation(
            "cannot remove activity owner".to_string(),
        ));
    }

    let affected = sqlx::query("DELETE FROM activity_members WHERE activity_id=$1 AND user_id=$2")
        .bind(activity_id)
        .bind(user_id)
        .execute(&state.db)
        .await?
        .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("member not found".to_string()));
    }

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(activity_id),
        "activity_member",
        Some(user_id),
        "remove_member",
        format!(
            "user {} removed member {} from activity {}",
            auth.0.username, user_id, activity_id
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(())
}

pub async fn ensure_activity_read_access(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
) -> Result<(), AppError> {
    if auth.0.role == "admin" || auth.0.role == "teacher" {
        return Ok(());
    }

    let can_access: Option<bool> = sqlx::query_scalar(
        r#"SELECT EXISTS(
            SELECT 1 FROM activities a
            LEFT JOIN activity_members m ON a.id = m.activity_id
            WHERE a.id=$1 AND a.is_deleted=FALSE AND (a.owner_id=$2 OR m.user_id=$2)
        )"#,
    )
    .bind(activity_id)
    .bind(auth.0.id)
    .fetch_optional(&state.db)
    .await?;

    if can_access.unwrap_or(false) {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

pub async fn ensure_activity_manage_access(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
) -> Result<(), AppError> {
    if auth.0.role == "admin" {
        return Ok(());
    }

    let owner_id: Option<Uuid> =
        sqlx::query_scalar("SELECT owner_id FROM activities WHERE id=$1 AND is_deleted=FALSE")
            .bind(activity_id)
            .fetch_optional(&state.db)
            .await?;

    match owner_id {
        Some(owner) if has_manage_privilege(&auth.0.role, owner, auth.0.id) => Ok(()),
        Some(_) => Err(AppError::Forbidden),
        None => Err(AppError::NotFound("activity not found".to_string())),
    }
}

pub async fn activity_member_exists(
    state: &AppState,
    activity_id: Uuid,
    user_id: Uuid,
) -> Result<bool, AppError> {
    let exists: Option<bool> = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM activity_members WHERE activity_id=$1 AND user_id=$2)",
    )
    .bind(activity_id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?;
    Ok(exists.unwrap_or(false))
}

#[cfg(test)]
mod tests {
    use super::has_manage_privilege;
    use uuid::Uuid;

    #[test]
    fn manage_privilege_matches_role_policy() {
        let owner = Uuid::new_v4();
        let student = Uuid::new_v4();
        assert!(has_manage_privilege("admin", owner, student));
        assert!(has_manage_privilege("teacher", owner, student));
        assert!(has_manage_privilege("student", owner, owner));
        assert!(!has_manage_privilege("student", owner, student));
    }
}
