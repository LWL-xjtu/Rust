use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::common::ApiResponse, errors::AppError, middleware::auth_extractor::AuthUser,
    services::operation_log_service, state::AppState,
};

pub async fn list_logs(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<crate::dto::operation_log::OperationLogResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        operation_log_service::list_logs(&state, &auth).await?,
    )))
}

pub async fn list_activity_logs(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(activity_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<crate::dto::operation_log::OperationLogResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        operation_log_service::list_activity_logs(&state, &auth, activity_id).await?,
    )))
}
