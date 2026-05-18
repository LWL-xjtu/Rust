use axum::{extract::State, Json};

use crate::{
    dto::{common::ApiResponse, user::UserResponse},
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::user_service,
    state::AppState,
};

pub async fn me(AuthUser(user): AuthUser) -> Json<ApiResponse<UserResponse>> {
    Json(ApiResponse::success(UserResponse::from(user)))
}

pub async fn list_users(
    State(state): State<AppState>,
    _auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<UserResponse>>>, AppError> {
    let users = user_service::list_users(&state.db)
        .await?
        .into_iter()
        .map(UserResponse::from)
        .collect();

    Ok(Json(ApiResponse::success(users)))
}
