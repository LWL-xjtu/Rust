use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{
        activity::{
            ActivityMemberResponse, ActivityResponse, AddActivityMemberRequest,
            CreateActivityRequest, UpdateActivityRequest,
        },
        common::ApiResponse,
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::activity_service,
    state::AppState,
};

/// 创建协作活动
///
/// 创建一个新的协作活动，创建者自动成为负责人。活动是场地预约、
/// 设备借用、任务分工与日志留痕的业务主线。
#[utoipa::path(
    post,
    path = "/api/activities",
    tag = "活动",
    security(("bearer_auth" = [])),
    request_body = CreateActivityRequest,
    responses((status = 200, description = "创建成功", body = ApiResponse<ActivityResponse>))
)]
pub async fn create(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateActivityRequest>,
) -> Result<Json<ApiResponse<ActivityResponse>>, AppError> {
    let data = activity_service::create_activity(&state, &auth, req).await?;
    Ok(Json(ApiResponse::success(data)))
}

/// 查询活动列表
#[utoipa::path(
    get,
    path = "/api/activities",
    tag = "活动",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "活动列表", body = ApiResponse<Vec<ActivityResponse>>))
)]
pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<ActivityResponse>>>, AppError> {
    let data = activity_service::list_activities(&state, &auth).await?;
    Ok(Json(ApiResponse::success(data)))
}

/// 查询活动详情
#[utoipa::path(
    get,
    path = "/api/activities/{id}",
    tag = "活动",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "活动 ID")),
    responses(
        (status = 200, description = "活动详情", body = ApiResponse<ActivityResponse>),
        (status = 404, description = "活动不存在", body = ApiResponseEmpty)
    )
)]
pub async fn get(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<ActivityResponse>>, AppError> {
    let data = activity_service::get_activity(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(data)))
}

/// 更新活动
#[utoipa::path(
    put,
    path = "/api/activities/{id}",
    tag = "活动",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "活动 ID")),
    request_body = UpdateActivityRequest,
    responses(
        (status = 200, description = "更新成功", body = ApiResponse<ActivityResponse>),
        (status = 403, description = "无权限", body = ApiResponseEmpty)
    )
)]
pub async fn update(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateActivityRequest>,
) -> Result<Json<ApiResponse<ActivityResponse>>, AppError> {
    let data = activity_service::update_activity(&state, &auth, id, req).await?;
    Ok(Json(ApiResponse::success(data)))
}

/// 删除活动
#[utoipa::path(
    delete,
    path = "/api/activities/{id}",
    tag = "活动",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "活动 ID")),
    responses(
        (status = 200, description = "删除成功", body = ApiResponseEmpty),
        (status = 403, description = "无权限", body = ApiResponseEmpty)
    )
)]
pub async fn delete(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    activity_service::delete_activity(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(())))
}

/// 查询活动成员列表
#[utoipa::path(
    get,
    path = "/api/activities/{id}/members",
    tag = "活动",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "活动 ID")),
    responses((status = 200, description = "成员列表", body = ApiResponse<Vec<ActivityMemberResponse>>))
)]
pub async fn list_members(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<ActivityMemberResponse>>>, AppError> {
    let data = activity_service::list_members(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(data)))
}

/// 添加活动成员
#[utoipa::path(
    post,
    path = "/api/activities/{id}/members",
    tag = "活动",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "活动 ID")),
    request_body = AddActivityMemberRequest,
    responses((status = 200, description = "添加成功", body = ApiResponse<ActivityMemberResponse>))
)]
pub async fn add_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<AddActivityMemberRequest>,
) -> Result<Json<ApiResponse<ActivityMemberResponse>>, AppError> {
    let data = activity_service::add_member(&state, &auth, id, req).await?;
    Ok(Json(ApiResponse::success(data)))
}

/// 移除活动成员
#[utoipa::path(
    delete,
    path = "/api/activities/{id}/members/{user_id}",
    tag = "活动",
    security(("bearer_auth" = [])),
    params(
        ("id" = Uuid, Path, description = "活动 ID"),
        ("user_id" = Uuid, Path, description = "成员用户 ID")
    ),
    responses((status = 200, description = "移除成功", body = ApiResponseEmpty))
)]
pub async fn remove_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    activity_service::remove_member(&state, &auth, id, user_id).await?;
    Ok(Json(ApiResponse::success(())))
}
