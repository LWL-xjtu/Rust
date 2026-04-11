use axum::Json;
use serde::Serialize;

use crate::dto::common::ApiResponse;

#[derive(Debug, Serialize)]
pub struct HealthPayload {
    pub status: &'static str,
}

pub async fn health() -> Json<ApiResponse<HealthPayload>> {
    Json(ApiResponse::success(HealthPayload { status: "ok" }))
}
