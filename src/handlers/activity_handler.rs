use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    dto::{
        activity::{AddActivityMemberRequest, CreateActivityRequest, UpdateActivityRequest},
        common::ApiResponse,
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::activity_service,
    state::AppState,
};

pub async fn create(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateActivityRequest>,
) -> Result<Json<ApiResponse<crate::dto::activity::ActivityResponse>>, AppError> {
    let data = activity_service::create_activity(&state, &auth, req).await?;
    Ok(Json(ApiResponse::success(data)))
}

pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<ApiResponse<Vec<crate::dto::activity::ActivityResponse>>>, AppError> {
    let data = activity_service::list_activities(&state, &auth).await?;
    Ok(Json(ApiResponse::success(data)))
}

pub async fn get(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<crate::dto::activity::ActivityResponse>>, AppError> {
    let data = activity_service::get_activity(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(data)))
}

pub async fn update(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateActivityRequest>,
) -> Result<Json<ApiResponse<crate::dto::activity::ActivityResponse>>, AppError> {
    let data = activity_service::update_activity(&state, &auth, id, req).await?;
    Ok(Json(ApiResponse::success(data)))
}

pub async fn delete(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    activity_service::delete_activity(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(())))
}

pub async fn list_members(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<crate::dto::activity::ActivityMemberResponse>>>, AppError> {
    let data = activity_service::list_members(&state, &auth, id).await?;
    Ok(Json(ApiResponse::success(data)))
}

pub async fn add_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<AddActivityMemberRequest>,
) -> Result<Json<ApiResponse<crate::dto::activity::ActivityMemberResponse>>, AppError> {
    let data = activity_service::add_member(&state, &auth, id, req).await?;
    Ok(Json(ApiResponse::success(data)))
}

pub async fn remove_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    activity_service::remove_member(&state, &auth, id, user_id).await?;
    Ok(Json(ApiResponse::success(())))
}
