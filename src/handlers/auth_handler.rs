use axum::{extract::State, Json};

use crate::{
    dto::{
        auth::{LoginRequest, LoginResponse, RegisterRequest},
        common::ApiResponse,
        user::UserResponse,
    },
    errors::AppError,
    services::auth_service,
    state::AppState,
};

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    let user = auth_service::register(
        &state,
        &payload.username,
        &payload.password,
        payload.college,
    )
    .await?;
    Ok(Json(ApiResponse::success(user)))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<ApiResponse<LoginResponse>>, AppError> {
    let login_result = auth_service::login(&state, &payload.username, &payload.password).await?;
    Ok(Json(ApiResponse::success(login_result)))
}
