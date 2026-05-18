use tracing::warn;
use uuid::Uuid;

use crate::{
    dto::operation_log::OperationLogResponse, errors::AppError,
    middleware::auth_extractor::AuthUser, models::operation_log::OperationLog,
    services::activity_service, state::AppState,
};

pub async fn try_log(
    state: &AppState,
    actor_id: Option<Uuid>,
    activity_id: Option<Uuid>,
    target_type: &str,
    target_id: Option<Uuid>,
    action: &str,
    summary: impl Into<String>,
    metadata: serde_json::Value,
) {
    let r = sqlx::query(
        r#"INSERT INTO operation_logs (id, actor_id, activity_id, target_type, target_id, action, summary, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)"#,
    )
    .bind(Uuid::new_v4())
    .bind(actor_id)
    .bind(activity_id)
    .bind(target_type)
    .bind(target_id)
    .bind(action)
    .bind(summary.into())
    .bind(metadata)
    .execute(&state.db)
    .await;

    if let Err(e) = r {
        warn!("failed to write operation log: {}", e);
    }
}

pub fn ensure_admin(role: &str) -> Result<(), AppError> {
    if role == "admin" {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

pub async fn list_logs(
    state: &AppState,
    auth: &AuthUser,
) -> Result<Vec<OperationLogResponse>, AppError> {
    if auth.0.role != "admin" && auth.0.role != "teacher" {
        return Err(AppError::Forbidden);
    }

    let rows = sqlx::query_as::<_, OperationLog>(
        "SELECT id,actor_id,activity_id,target_type,target_id,action,summary,metadata,created_at FROM operation_logs ORDER BY created_at DESC LIMIT 200",
    )
    .fetch_all(&state.db)
    .await?;

    Ok(rows.into_iter().map(OperationLogResponse::from).collect())
}

pub async fn list_activity_logs(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
) -> Result<Vec<OperationLogResponse>, AppError> {
    activity_service::ensure_activity_read_access(state, auth, activity_id).await?;

    let rows = sqlx::query_as::<_, OperationLog>(
        "SELECT id,actor_id,activity_id,target_type,target_id,action,summary,metadata,created_at FROM operation_logs WHERE activity_id=$1 ORDER BY created_at DESC LIMIT 200",
    )
    .bind(activity_id)
    .fetch_all(&state.db)
    .await?;

    Ok(rows.into_iter().map(OperationLogResponse::from).collect())
}
