use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::common::ApiResponse, errors::AppError, middleware::auth_extractor::AuthUser,
    services::stats_service, state::AppState,
};

pub async fn overview(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<crate::dto::stats::OverviewStatsResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        stats_service::overview(&state, &auth).await?,
    )))
}

pub async fn activity_stats(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(activity_id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::stats::ActivityStatsResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        stats_service::activity_stats(&state, &auth, activity_id).await?,
    )))
}

pub async fn college_stats(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<crate::dto::stats::CollegeStatsResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        stats_service::college_stats(&state, &auth).await?,
    )))
}
