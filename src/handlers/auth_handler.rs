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

/// 用户注册
///
/// 创建一个新用户。用户名唯一，密码使用 Argon2id 加密存储。
#[utoipa::path(
    post,
    path = "/api/auth/register",
    tag = "认证",
    request_body = RegisterRequest,
    responses(
        (status = 200, description = "注册成功", body = ApiResponse<UserResponse>),
        (status = 409, description = "用户名已存在", body = ApiResponseEmpty)
    )
)]
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    let user = auth_service::register(
        &state,
        &payload.username,
        payload.email.as_deref(),
        &payload.password,
        payload.college,
    )
    .await?;
    Ok(Json(ApiResponse::success(user)))
}

/// 用户登录
///
/// 校验用户名和密码，成功后签发 JWT 令牌。后续受保护接口需在
/// `Authorization: Bearer <token>` 头中携带该令牌。
#[utoipa::path(
    post,
    path = "/api/auth/login",
    tag = "认证",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "登录成功，返回令牌与用户信息", body = ApiResponse<LoginResponse>),
        (status = 401, description = "用户名或密码错误", body = ApiResponseEmpty)
    )
)]
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<ApiResponse<LoginResponse>>, AppError> {
    let login_result = auth_service::login(&state, &payload.username, &payload.password).await?;
    Ok(Json(ApiResponse::success(login_result)))
}
