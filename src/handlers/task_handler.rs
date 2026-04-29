use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{
        common::ApiResponse,
        task::{
            AddTaskProgressLogRequest, CreateTaskRequest, UpdateTaskRequest,
            UpdateTaskStatusRequest,
        },
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::task_service,
    state::AppState,
};

pub async fn create_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateTaskRequest>,
) -> Result<Json<ApiResponse<crate::dto::task::TaskResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::create_task(&state, &auth, req).await?,
    )))
}
pub async fn list_tasks(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<crate::dto::task::TaskResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::list_tasks(&state, &auth).await?,
    )))
}
pub async fn get_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::task::TaskResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::get_task(&state, &auth, id).await?,
    )))
}
pub async fn update_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTaskRequest>,
) -> Result<Json<ApiResponse<crate::dto::task::TaskResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::update_task(&state, &auth, id, req).await?,
    )))
}
pub async fn delete_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    task_service::delete_task(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(())))
}
pub async fn update_task_status(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTaskStatusRequest>,
) -> Result<Json<ApiResponse<crate::dto::task::TaskResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::update_task_status(&state, &auth, id, req).await?,
    )))
}
pub async fn add_task_progress_log(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<AddTaskProgressLogRequest>,
) -> Result<Json<ApiResponse<crate::dto::task::TaskProgressLogResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::add_progress_log(&state, &auth, id, req).await?,
    )))
}
pub async fn get_task_progress_logs(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<crate::dto::task::TaskProgressLogResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::list_task_logs(&state, &auth, id).await?,
    )))
}
pub async fn list_activity_tasks(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(activity_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<crate::dto::task::TaskResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        task_service::list_activity_tasks(&state, &auth, activity_id).await?,
    )))
}
