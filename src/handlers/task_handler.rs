use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{
        common::ApiResponse,
        task::{
            AddTaskProgressLogRequest, CreateTaskRequest, TaskProgressLogResponse, TaskResponse,
            UpdateTaskRequest, UpdateTaskStatusRequest,
        },
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::task_service,
    state::AppState,
};

/// 创建任务
///
/// 在某个活动下创建任务并可指定负责人，用于成员分工。
#[utoipa::path(
    post,
    path = "/api/tasks",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    request_body = CreateTaskRequest,
    responses((status = 200, description = "创建成功", body = ApiResponse<TaskResponse>))
)]
pub async fn create_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateTaskRequest>,
) -> Result<Json<ApiResponse<TaskResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::create_task(&state, &auth, req).await?,
    )))
}

/// 查询任务列表
#[utoipa::path(
    get,
    path = "/api/tasks",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "任务列表", body = ApiResponse<Vec<TaskResponse>>))
)]
pub async fn list_tasks(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<TaskResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::list_tasks(&state, &auth).await?,
    )))
}

/// 查询任务详情
#[utoipa::path(
    get,
    path = "/api/tasks/{id}",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "任务 ID")),
    responses((status = 200, description = "任务详情", body = ApiResponse<TaskResponse>))
)]
pub async fn get_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<TaskResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::get_task(&state, &auth, id).await?,
    )))
}

/// 更新任务
#[utoipa::path(
    put,
    path = "/api/tasks/{id}",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "任务 ID")),
    request_body = UpdateTaskRequest,
    responses((status = 200, description = "更新成功", body = ApiResponse<TaskResponse>))
)]
pub async fn update_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTaskRequest>,
) -> Result<Json<ApiResponse<TaskResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::update_task(&state, &auth, id, req).await?,
    )))
}

/// 删除任务
#[utoipa::path(
    delete,
    path = "/api/tasks/{id}",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "任务 ID")),
    responses((status = 200, description = "删除成功", body = ApiResponseEmpty))
)]
pub async fn delete_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    task_service::delete_task(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(())))
}

/// 更新任务状态
///
/// 变更任务状态（待开始/进行中/已完成/已延期等），并自动写入一条
/// 进度记录用于过程留痕。
#[utoipa::path(
    post,
    path = "/api/tasks/{id}/status",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "任务 ID")),
    request_body = UpdateTaskStatusRequest,
    responses((status = 200, description = "状态已更新", body = ApiResponse<TaskResponse>))
)]
pub async fn update_task_status(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTaskStatusRequest>,
) -> Result<Json<ApiResponse<TaskResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::update_task_status(&state, &auth, id, req).await?,
    )))
}

/// 添加任务进度记录
#[utoipa::path(
    post,
    path = "/api/tasks/{id}/progress-logs",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "任务 ID")),
    request_body = AddTaskProgressLogRequest,
    responses((status = 200, description = "已记录", body = ApiResponse<TaskProgressLogResponse>))
)]
pub async fn add_task_progress_log(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<AddTaskProgressLogRequest>,
) -> Result<Json<ApiResponse<TaskProgressLogResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::add_progress_log(&state, &auth, id, req).await?,
    )))
}

/// 查询任务进度记录
#[utoipa::path(
    get,
    path = "/api/tasks/{id}/progress-logs",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "任务 ID")),
    responses((status = 200, description = "进度记录列表", body = ApiResponse<Vec<TaskProgressLogResponse>>))
)]
pub async fn get_task_progress_logs(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<TaskProgressLogResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::list_task_logs(&state, &auth, id).await?,
    )))
}

/// 查询活动下的任务列表
#[utoipa::path(
    get,
    path = "/api/activities/{id}/tasks",
    tag = "任务分工",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "活动 ID")),
    responses((status = 200, description = "任务列表", body = ApiResponse<Vec<TaskResponse>>))
)]
pub async fn list_activity_tasks(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(activity_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<TaskResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::list_activity_tasks(&state, &auth, activity_id).await?,
    )))
}
