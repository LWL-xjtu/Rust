use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{
        common::ApiResponse,
        stats::{ActivityStatsResponse, CollegeStatsResponse, OverviewStatsResponse},
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::stats_service,
    state::AppState,
};

/// 总览统计
///
/// 返回活动、预约、借用、任务、用户等整体计数指标。
#[utoipa::path(
    get,
    path = "/api/stats/overview",
    tag = "统计分析",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "总览统计", body = ApiResponse<OverviewStatsResponse>))
)]
pub async fn overview(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<OverviewStatsResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        stats_service::overview(&state, &auth).await?,
    )))
}

/// 活动维度统计
#[utoipa::path(
    get,
    path = "/api/stats/activities/{id}",
    tag = "统计分析",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "活动 ID")),
    responses((status = 200, description = "活动统计", body = ApiResponse<ActivityStatsResponse>))
)]
pub async fn activity_stats(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(activity_id): Path<Uuid>,
) -> Result<Json<ApiResponse<ActivityStatsResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        stats_service::activity_stats(&state, &auth, activity_id).await?,
    )))
}

/// 书院/学院维度统计
///
/// 按学院聚合活动、预约、借用、任务完成率与成员参与情况。
#[utoipa::path(
    get,
    path = "/api/stats/colleges",
    tag = "统计分析",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "学院统计", body = ApiResponse<CollegeStatsResponse>))
)]
pub async fn college_stats(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<CollegeStatsResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        stats_service::college_stats(&state, &auth).await?,
    )))
}
