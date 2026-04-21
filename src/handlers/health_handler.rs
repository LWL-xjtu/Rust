use axum::{extract::State, Json};
use serde::Serialize;

use crate::{dto::common::ApiResponse, errors::AppError, state::AppState};

#[derive(Debug, Serialize)]
pub struct HealthPayload {
    pub status: &'static str,
}

#[derive(Debug, Serialize)]
pub struct ReadyPayload {
    pub status: &'static str,
    pub database: &'static str,
}

pub async fn health() -> Json<ApiResponse<HealthPayload>> {
    Json(ApiResponse::success(HealthPayload { status: "ok" }))
}

pub async fn live() -> Json<ApiResponse<HealthPayload>> {
    Json(ApiResponse::success(HealthPayload { status: "alive" }))
}

pub async fn ready(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ReadyPayload>>, AppError> {
    sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&state.db)
        .await?;

    Ok(Json(ApiResponse::success(ReadyPayload {
        status: "ready",
        database: "up",
    })))
}
