use axum::Json;

use crate::{
    dto::{common::ApiResponse, user::UserResponse},
    middleware::auth_extractor::AuthUser,
};

pub async fn me(AuthUser(user): AuthUser) -> Json<ApiResponse<UserResponse>> {
    Json(ApiResponse::success(UserResponse::from(user)))
}
