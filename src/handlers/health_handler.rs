use axum::{extract::State, Json};
use serde::Serialize;
use utoipa::ToSchema;

use crate::{dto::common::ApiResponse, errors::AppError, state::AppState};

#[derive(Debug, Serialize, ToSchema)]
pub struct HealthPayload {
    pub status: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ReadyPayload {
    pub status: String,
    pub database: String,
}

/// 健康检查
///
/// 用于探活，返回服务运行状态，不访问数据库。
#[utoipa::path(
    get,
    path = "/health",
    tag = "系统",
    responses((status = 200, description = "服务正常", body = ApiResponse<HealthPayload>))
)]
pub async fn health() -> Json<ApiResponse<HealthPayload>> {
    Json(ApiResponse::success(HealthPayload {
        status: "ok".to_string(),
    }))
}

/// 存活探针
#[utoipa::path(
    get,
    path = "/health/live",
    tag = "系统",
    responses((status = 200, description = "进程存活", body = ApiResponse<HealthPayload>))
)]
pub async fn live() -> Json<ApiResponse<HealthPayload>> {
    Json(ApiResponse::success(HealthPayload {
        status: "alive".to_string(),
    }))
}

/// 就绪探针
///
/// 检查数据库连通性，确认服务可对外提供完整功能。
#[utoipa::path(
    get,
    path = "/health/ready",
    tag = "系统",
    responses(
        (status = 200, description = "数据库可用", body = ApiResponse<ReadyPayload>),
        (status = 500, description = "数据库不可用", body = ApiResponseEmpty)
    )
)]
pub async fn ready(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ReadyPayload>>, AppError> {
    sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&state.db)
        .await?;

    Ok(Json(ApiResponse::success(ReadyPayload {
        status: "ready".to_string(),
        database: "up".to_string(),
    })))
}
