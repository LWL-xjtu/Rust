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
            DeviceBorrowResponse, DeviceResponse, UpdateDeviceRequest,
        },
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::device_service,
    state::AppState,
};

/// 查询设备列表
#[utoipa::path(
    get,
    path = "/api/devices",
    tag = "设备借用",
    responses((status = 200, description = "设备列表", body = ApiResponse<Vec<DeviceResponse>>))
)]
pub async fn list_devices(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<DeviceResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::list_devices(&state).await?,
    )))
}

/// 创建设备
#[utoipa::path(
    post,
    path = "/api/devices",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    request_body = CreateDeviceRequest,
    responses((status = 200, description = "创建成功", body = ApiResponse<DeviceResponse>))
)]
pub async fn create_device(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateDeviceRequest>,
) -> Result<Json<ApiResponse<DeviceResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::create_device(&state, &auth, req).await?,
    )))
}

/// 查询设备详情
#[utoipa::path(
    get,
    path = "/api/devices/{id}",
    tag = "设备借用",
    params(("id" = Uuid, Path, description = "设备 ID")),
    responses(
        (status = 200, description = "设备详情", body = ApiResponse<DeviceResponse>),
        (status = 404, description = "设备不存在", body = ApiResponseEmpty)
    )
)]
pub async fn get_device(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<DeviceResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::get_device(&state, id).await?,
    )))
}

/// 更新设备
#[utoipa::path(
    put,
    path = "/api/devices/{id}",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "设备 ID")),
    request_body = UpdateDeviceRequest,
    responses((status = 200, description = "更新成功", body = ApiResponse<DeviceResponse>))
)]
pub async fn update_device(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateDeviceRequest>,
) -> Result<Json<ApiResponse<DeviceResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::update_device(&state, &auth, id, req).await?,
    )))
}

/// 删除设备
#[utoipa::path(
    delete,
    path = "/api/devices/{id}",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "设备 ID")),
    responses((status = 200, description = "删除成功", body = ApiResponseEmpty))
)]
pub async fn delete_device(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    device_service::delete_device(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(())))
}

/// 申请借用设备
///
/// 提交设备借用申请，记录预计归还时间。后续经历审批、借出、归还
/// 等状态流转。
#[utoipa::path(
    post,
    path = "/api/device-borrows",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    request_body = CreateDeviceBorrowRequest,
    responses(
        (status = 200, description = "申请成功", body = ApiResponse<DeviceBorrowResponse>),
        (status = 409, description = "设备库存不足", body = ApiResponseEmpty)
    )
)]
pub async fn create_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateDeviceBorrowRequest>,
) -> Result<Json<ApiResponse<DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::create_borrow(&state, &auth, req).await?,
    )))
}

/// 查询借用记录列表
#[utoipa::path(
    get,
    path = "/api/device-borrows",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "借用记录列表", body = ApiResponse<Vec<DeviceBorrowResponse>>))
)]
pub async fn list_borrows(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<DeviceBorrowResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::list_borrows(&state, &auth).await?,
    )))
}

/// 查询借用记录详情
#[utoipa::path(
    get,
    path = "/api/device-borrows/{id}",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "借用记录 ID")),
    responses((status = 200, description = "借用记录详情", body = ApiResponse<DeviceBorrowResponse>))
)]
pub async fn get_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::get_borrow(&state, &auth, id).await?,
    )))
}

/// 审批通过借用申请
#[utoipa::path(
    post,
    path = "/api/device-borrows/{id}/approve",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "借用记录 ID")),
    responses((status = 200, description = "审批通过", body = ApiResponse<DeviceBorrowResponse>))
)]
pub async fn approve_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::approve_borrow(&state, &auth, id).await?,
    )))
}

/// 驳回借用申请
#[utoipa::path(
    post,
    path = "/api/device-borrows/{id}/reject",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "借用记录 ID")),
    request_body = BorrowActionRequest,
    responses((status = 200, description = "已驳回", body = ApiResponse<DeviceBorrowResponse>))
)]
pub async fn reject_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<BorrowActionRequest>,
) -> Result<Json<ApiResponse<DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::reject_borrow(&state, &auth, id, req).await?,
    )))
}

/// 借出设备（登记领取）
#[utoipa::path(
    post,
    path = "/api/device-borrows/{id}/checkout",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "借用记录 ID")),
    responses((status = 200, description = "已借出", body = ApiResponse<DeviceBorrowResponse>))
)]
pub async fn checkout_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::checkout_borrow(&state, &auth, id).await?,
    )))
}

/// 归还设备
#[utoipa::path(
    post,
    path = "/api/device-borrows/{id}/return",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "借用记录 ID")),
    responses((status = 200, description = "已归还", body = ApiResponse<DeviceBorrowResponse>))
)]
pub async fn return_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::return_borrow(&state, &auth, id).await?,
    )))
}

/// 取消借用申请
#[utoipa::path(
    post,
    path = "/api/device-borrows/{id}/cancel",
    tag = "设备借用",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "借用记录 ID")),
    request_body = BorrowActionRequest,
    responses((status = 200, description = "已取消", body = ApiResponse<DeviceBorrowResponse>))
)]
pub async fn cancel_borrow(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<BorrowActionRequest>,
) -> Result<Json<ApiResponse<DeviceBorrowResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        device_service::cancel_borrow(&state, &auth, id, req).await?,
    )))
}
