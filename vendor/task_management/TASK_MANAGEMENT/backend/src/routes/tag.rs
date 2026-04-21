use axum::{
    routing::{get, post, put, delete},
    Router,
    extract::{Path, State, Extension},
    Json,
    http::StatusCode,
};
use std::sync::Arc;
use serde_json::Value;

use crate::middleware::auth::auth_middleware;
use crate::models::tag::{Tag, CreateTag, UpdateTag};
use crate::handlers::tag;
// Import AppState from the new state module
use crate::state::AppState;

pub fn tag_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_tags))
        .route("/", post(create_tag))
        .route("/:id", get(get_tag))
        .route("/:id", put(update_tag))
        .route("/:id", delete(delete_tag))
        .route_layer(axum::middleware::from_fn(auth_middleware))
}

async fn get_tags(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Tag>>, StatusCode> {
    tag::get_tags_handler(&state.pool).await
}

async fn create_tag(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
    Json(payload): Json<CreateTag>,
) -> Result<Json<Tag>, StatusCode> {
    tag::create_tag_handler(payload, user_id, &state.pool).await
}

async fn get_tag(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<Json<Tag>, StatusCode> {
    tag::get_tag_handler(id, &state.pool).await
}

async fn update_tag(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateTag>,
) -> Result<Json<Tag>, StatusCode> {
    tag::update_tag_handler(id, payload, user_id, &state.pool).await
}

async fn delete_tag(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>, // Extract user_id from extensions
    Path(id): Path<i32>,
) -> Result<Json<Value>, StatusCode> {
    tag::delete_tag_handler(id, user_id, &state.pool).await
}