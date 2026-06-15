use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{
        admin::{UpdateUserCollegeRequest, UpdateUserRoleRequest, UpdateUserStatusRequest},
        common::ApiResponse,
        user::UserResponse,
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::{operation_log_service, user_service},
    state::AppState,
};

fn ensure_admin(auth: &AuthUser) -> Result<(), AppError> {
    if auth.0.role == "admin" {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

/// 查询所有用户（管理员）
#[utoipa::path(
    get,
    path = "/api/admin/users",
    tag = "管理员",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "用户列表", body = ApiResponse<Vec<UserResponse>>),
        (status = 403, description = "非管理员", body = ApiResponseEmpty)
    )
)]
pub async fn list_users(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<UserResponse>>>, AppError> {
    ensure_admin(&auth)?;
    let users = user_service::list_users(&state.db)
        .await?
        .into_iter()
        .map(UserResponse::from)
        .collect();
    Ok(Json(ApiResponse::success(users)))
}

/// 修改用户角色（管理员）
#[utoipa::path(
    put,
    path = "/api/admin/users/{id}/role",
    tag = "管理员",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "用户 ID")),
    request_body = UpdateUserRoleRequest,
    responses(
        (status = 200, description = "已更新", body = ApiResponse<UserResponse>),
        (status = 403, description = "非管理员", body = ApiResponseEmpty)
    )
)]
pub async fn update_user_role(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(user_id): Path<Uuid>,
    Json(req): Json<UpdateUserRoleRequest>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    ensure_admin(&auth)?;
    let current = user_service::get_user_by_id(&state.db, user_id).await?;
    if current.role == "admin" && req.role != "admin" {
        let admins = user_service::count_admin_users(&state.db).await?;
        if admins <= 1 {
            return Err(AppError::Validation("系统至少需要一个管理员".to_string()));
        }
    }
    let user = sqlx::query_as::<_, crate::models::user::User>(
        "UPDATE users SET role=$2 WHERE id=$1 RETURNING id,username,email,password_hash,role,college,is_active,created_at,updated_at",
    )
    .bind(user_id)
    .bind(req.role)
    .fetch_one(&state.db)
    .await?;
    operation_log_service::try_log(
        &state,
        Some(auth.0.id),
        None,
        "user",
        Some(user_id),
        "update_user_role",
        format!("修改用户角色 {}", user.username),
        serde_json::json!({}),
    )
    .await;
    Ok(Json(ApiResponse::success(UserResponse::from(user))))
}

/// 启用/禁用用户（管理员）
#[utoipa::path(
    put,
    path = "/api/admin/users/{id}/status",
    tag = "管理员",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "用户 ID")),
    request_body = UpdateUserStatusRequest,
    responses(
        (status = 200, description = "已更新", body = ApiResponse<UserResponse>),
        (status = 403, description = "非管理员", body = ApiResponseEmpty)
    )
)]
pub async fn update_user_status(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(user_id): Path<Uuid>,
    Json(req): Json<UpdateUserStatusRequest>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    ensure_admin(&auth)?;
    let current = user_service::get_user_by_id(&state.db, user_id).await?;
    if current.role == "admin" && !req.is_active {
        let admins = user_service::count_admin_users(&state.db).await?;
        if admins <= 1 {
            return Err(AppError::Validation("不能禁用最后一个管理员".to_string()));
        }
    }
    let user = sqlx::query_as::<_, crate::models::user::User>(
        "UPDATE users SET is_active=$2 WHERE id=$1 RETURNING id,username,email,password_hash,role,college,is_active,created_at,updated_at",
    )
    .bind(user_id)
    .bind(req.is_active)
    .fetch_one(&state.db)
    .await?;
    operation_log_service::try_log(
        &state,
        Some(auth.0.id),
        None,
        "user",
        Some(user_id),
        if req.is_active {
            "enable_user"
        } else {
            "disable_user"
        },
        format!("修改用户状态 {}", user.username),
        serde_json::json!({}),
    )
    .await;
    Ok(Json(ApiResponse::success(UserResponse::from(user))))
}

/// 修改用户所属书院/学院（管理员）
#[utoipa::path(
    put,
    path = "/api/admin/users/{id}/college",
    tag = "管理员",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "用户 ID")),
    request_body = UpdateUserCollegeRequest,
    responses(
        (status = 200, description = "已更新", body = ApiResponse<UserResponse>),
        (status = 403, description = "非管理员", body = ApiResponseEmpty)
    )
)]
pub async fn update_user_college(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(user_id): Path<Uuid>,
    Json(req): Json<UpdateUserCollegeRequest>,
) -> Result<Json<ApiResponse<UserResponse>>, AppError> {
    ensure_admin(&auth)?;
    let user = sqlx::query_as::<_, crate::models::user::User>(
        "UPDATE users SET college=$2 WHERE id=$1 RETURNING id,username,email,password_hash,role,college,is_active,created_at,updated_at",
    )
    .bind(user_id)
    .bind(req.college.map(|v| v.trim().to_string()).filter(|v| !v.is_empty()))
    .fetch_one(&state.db)
    .await?;
    operation_log_service::try_log(
        &state,
        Some(auth.0.id),
        None,
        "user",
        Some(user_id),
        "update_user_college",
        "修改用户所属书院/学院",
        serde_json::json!({}),
    )
    .await;
    Ok(Json(ApiResponse::success(UserResponse::from(user))))
}
