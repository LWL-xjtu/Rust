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
use crate::models::category::{Category, CreateCategory, UpdateCategory};
use crate::handlers::category;
// Import AppState from the new state module
use crate::state::AppState;

pub fn category_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_categories))
        .route("/", post(create_category))
        .route("/:id", get(get_category))
        .route("/:id", put(update_category))
        .route("/:id", delete(delete_category))
        .route_layer(axum::middleware::from_fn(auth_middleware))
}

async fn get_categories(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Category>>, StatusCode> {
    category::get_categories_handler(&state.pool).await
}

async fn create_category(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
    Json(payload): Json<CreateCategory>,
) -> Result<Json<Category>, StatusCode> {
    category::create_category_handler(payload, user_id, &state.pool).await
}

async fn get_category(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<Json<Category>, StatusCode> {
    category::get_category_handler(id, &state.pool).await
}

async fn update_category(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateCategory>,
) -> Result<Json<Category>, StatusCode> {
    category::update_category_handler(id, payload, user_id, &state.pool).await
}

async fn delete_category(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>, // Extract user_id from extensions
    Path(id): Path<i32>,
) -> Result<Json<Value>, StatusCode> {
    category::delete_category_handler(id, user_id, &state.pool).await
}