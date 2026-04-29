use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{
        common::ApiResponse,
        device::{
            BorrowActionRequest, CreateDeviceBorrowRequest, CreateDeviceRequest,
            UpdateDeviceRequest,
        },
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::device_service,
    state::AppState,
};

pub async fn list_devices(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<crate::dto::device::DeviceResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::list_devices(&state).await?,
    )))
}
pub async fn create_device(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateDeviceRequest>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::create_device(&state, &auth, req).await?,
    )))
}
pub async fn get_device(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::get_device(&state, id).await?,
    )))
}
pub async fn update_device(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateDeviceRequest>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::update_device(&state, &auth, id, req).await?,
    )))
}
pub async fn delete_device(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    device_service::delete_device(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(())))
}

pub async fn create_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateDeviceBorrowRequest>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::create_borrow(&state, &auth, req).await?,
    )))
}
pub async fn list_borrows(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<crate::dto::device::DeviceBorrowResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::list_borrows(&state, &auth).await?,
    )))
}
pub async fn get_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::get_borrow(&state, &auth, id).await?,
    )))
}
pub async fn approve_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::approve_borrow(&state, &auth, id).await?,
    )))
}
pub async fn reject_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<BorrowActionRequest>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::reject_borrow(&state, &auth, id, req).await?,
    )))
}
pub async fn checkout_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::checkout_borrow(&state, &auth, id).await?,
    )))
}
pub async fn return_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::return_borrow(&state, &auth, id).await?,
    )))
}
pub async fn cancel_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<BorrowActionRequest>,
) -> Result<Json<ApiResponse<crate::dto::device::DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::cancel_borrow(&state, &auth, id, req).await?,
    )))
}
