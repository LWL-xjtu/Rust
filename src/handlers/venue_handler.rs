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
        },
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::venue_service,
    state::AppState,
};

pub async fn list_venues(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<crate::dto::venue::VenueResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::list_venues(&state).await?,
    )))
}
pub async fn create_venue(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateVenueRequest>,
) -> Result<Json<ApiResponse<crate::dto::venue::VenueResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::create_venue(&state, &auth, req).await?,
    )))
}
pub async fn update_venue(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateVenueRequest>,
) -> Result<Json<ApiResponse<crate::dto::venue::VenueResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::update_venue(&state, &auth, id, req).await?,
    )))
}
pub async fn delete_venue(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    venue_service::delete_venue(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(())))
}

pub async fn create_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateVenueBookingRequest>,
) -> Result<Json<ApiResponse<crate::dto::venue::VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::create_booking(&state, &auth, req).await?,
    )))
}
pub async fn list_bookings(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<crate::dto::venue::VenueBookingResponse>>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::list_bookings(&state, &auth).await?,
    )))
}
pub async fn get_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::venue::VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::get_booking(&state, &auth, id).await?,
    )))
}
pub async fn approve_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::venue::VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::approve_booking(&state, &auth, id).await?,
    )))
}
pub async fn reject_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<ActionReasonRequest>,
) -> Result<Json<ApiResponse<crate::dto::venue::VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::reject_booking(&state, &auth, id, req).await?,
    )))
}
pub async fn cancel_booking(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<ActionReasonRequest>,
) -> Result<Json<ApiResponse<crate::dto::venue::VenueBookingResponse>>, AppError> {
    Ok(Json(ApiResponse::success(
        venue_service::cancel_booking(&state, &auth, id, req).await?,
    )))
}
