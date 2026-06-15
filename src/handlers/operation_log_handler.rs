use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{common::ApiResponse, operation_log::OperationLogResponse},
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::operation_log_service,
    state::AppState,
};

/// 查询操作日志
///
/// 返回系统关键操作的留痕记录（创建、审批、借用、归还、状态变更等）。
#[utoipa::path(
    get,
    path = "/api/operation-logs",
    tag = "日志留痕",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "操作日志列表", body = ApiResponse<Vec<OperationLogResponse>>))
)]
pub async fn list_logs(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<OperationLogResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        operation_log_service::list_logs(&state, &auth).await?,
    )))
}

/// 查询指定活动的操作日志
#[utoipa::path(
    get,
    path = "/api/activities/{id}/operation-logs",
    tag = "日志留痕",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "活动 ID")),
    responses((status = 200, description = "活动操作日志列表", body = ApiResponse<Vec<OperationLogResponse>>))
)]
pub async fn list_activity_logs(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(activity_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<OperationLogResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        operation_log_service::list_activity_logs(&state, &auth, activity_id).await?,
    )))
}
