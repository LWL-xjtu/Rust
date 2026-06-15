use axum::{extract::State, Json};

use crate::{
    dto::{common::ApiResponse, user::UserResponse},
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::user_service,
    state::AppState,
};

/// 获取当前登录用户信息
#[utoipa::path(
    get,
    path = "/api/users/me",
    tag = "用户",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "当前用户信息", body = ApiResponse<UserResponse>),
        (status = 401, description = "未认证", body = ApiResponseEmpty)
    )
)]
pub async fn me(AuthUser(user): AuthUser) -> Json<ApiResponse<UserResponse>> {
    Json(ApiResponse::success(UserResponse::from(user)))
}

/// 获取用户列表
///
/// 返回系统中全部用户的基础信息，需登录后访问。
#[utoipa::path(
    get,
    path = "/api/users",
    tag = "用户",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "用户列表", body = ApiResponse<Vec<UserResponse>>),
        (status = 401, description = "未认证", body = ApiResponseEmpty)
    )
)]
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
