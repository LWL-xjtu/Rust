use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{
        common::ApiResponse,
        venue::{
            ActionReasonRequest, CreateVenueBookingRequest, CreateVenueRequest, UpdateVenueRequest,
            VenueBookingResponse, VenueResponse,
        },
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::venue_service,
    state::AppState,
};

/// 查询场地列表
#[utoipa::path(
    get,
    path = "/api/venues",
    tag = "场地预约",
    responses((status = 200, description = "场地列表", body = ApiResponse<Vec<VenueResponse>>))
)]
pub async fn list_venues(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<VenueResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::list_venues(&state).await?,
    )))
}

/// 创建场地
#[utoipa::path(
    post,
    path = "/api/venues",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    request_body = CreateVenueRequest,
    responses(
        (status = 200, description = "创建成功", body = ApiResponse<VenueResponse>),
        (status = 409, description = "场地已存在", body = ApiResponseEmpty)
    )
)]
pub async fn create_venue(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateVenueRequest>,
) -> Result<Json<ApiResponse<VenueResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::create_venue(&state, &auth, req).await?,
    )))
}

/// 更新场地
#[utoipa::path(
    put,
    path = "/api/venues/{id}",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "场地 ID")),
    request_body = UpdateVenueRequest,
    responses((status = 200, description = "更新成功", body = ApiResponse<VenueResponse>))
)]
pub async fn update_venue(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateVenueRequest>,
) -> Result<Json<ApiResponse<VenueResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::update_venue(&state, &auth, id, req).await?,
    )))
}

/// 删除场地
#[utoipa::path(
    delete,
    path = "/api/venues/{id}",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "场地 ID")),
    responses((status = 200, description = "删除成功", body = ApiResponseEmpty))
)]
pub async fn delete_venue(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    venue_service::delete_venue(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(())))
}

/// 创建场地预约
///
/// 申请在指定时间段使用某场地。系统会校验同一场地的时间区间是否
/// 与已有有效预约重叠，重叠则返回冲突错误。
#[utoipa::path(
    post,
    path = "/api/venue-bookings",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    request_body = CreateVenueBookingRequest,
    responses(
        (status = 200, description = "预约成功", body = ApiResponse<VenueBookingResponse>),
        (status = 409, description = "预约时间冲突", body = ApiResponseEmpty)
    )
)]
pub async fn create_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateVenueBookingRequest>,
) -> Result<Json<ApiResponse<VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::create_booking(&state, &auth, req).await?,
    )))
}

/// 查询预约列表
#[utoipa::path(
    get,
    path = "/api/venue-bookings",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    responses((status = 200, description = "预约列表", body = ApiResponse<Vec<VenueBookingResponse>>))
)]
pub async fn list_bookings(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<VenueBookingResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::list_bookings(&state, &auth).await?,
    )))
}

/// 查询预约详情
#[utoipa::path(
    get,
    path = "/api/venue-bookings/{id}",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "预约 ID")),
    responses((status = 200, description = "预约详情", body = ApiResponse<VenueBookingResponse>))
)]
pub async fn get_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::get_booking(&state, &auth, id).await?,
    )))
}

/// 审批通过预约
#[utoipa::path(
    post,
    path = "/api/venue-bookings/{id}/approve",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "预约 ID")),
    responses((status = 200, description = "审批通过", body = ApiResponse<VenueBookingResponse>))
)]
pub async fn approve_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::approve_booking(&state, &auth, id).await?,
    )))
}

/// 驳回预约
#[utoipa::path(
    post,
    path = "/api/venue-bookings/{id}/reject",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "预约 ID")),
    request_body = ActionReasonRequest,
    responses((status = 200, description = "已驳回", body = ApiResponse<VenueBookingResponse>))
)]
pub async fn reject_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<ActionReasonRequest>,
) -> Result<Json<ApiResponse<VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::reject_booking(&state, &auth, id, req).await?,
    )))
}

/// 取消预约
#[utoipa::path(
    post,
    path = "/api/venue-bookings/{id}/cancel",
    tag = "场地预约",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "预约 ID")),
    request_body = ActionReasonRequest,
    responses((status = 200, description = "已取消", body = ApiResponse<VenueBookingResponse>))
)]
pub async fn cancel_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<ActionReasonRequest>,
) -> Result<Json<ApiResponse<VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::cancel_booking(&state, &auth, id, req).await?,
    )))
}
