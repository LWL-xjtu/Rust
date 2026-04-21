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
use crate::models::task::{Task, CreateTask, UpdateTask};
use crate::handlers::task;
// Import AppState from the new state module
use crate::state::AppState;

pub fn task_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_tasks))
        .route("/", post(create_task))
        .route("/:id", get(get_task))
        .route("/:id", put(update_task))
        .route("/:id", delete(delete_task))
        .route_layer(axum::middleware::from_fn(auth_middleware))
}

async fn get_tasks(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
) -> Result<Json<Vec<Task>>, StatusCode> {
    task::get_tasks_handler(user_id, &state.pool).await
}

async fn create_task(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
    Json(payload): Json<CreateTask>,
) -> Result<Json<Task>, StatusCode> {
    task::create_task_handler(user_id, payload, &state.pool).await
}

async fn get_task(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
    Path(id): Path<i32>,
) -> Result<Json<Task>, StatusCode> {
    task::get_task_handler(user_id, id, &state.pool).await
}

async fn update_task(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateTask>,
) -> Result<Json<Task>, StatusCode> {
    task::update_task_handler(user_id, id, payload, &state.pool).await
}

async fn delete_task(
    State(state): State<Arc<AppState>>,
    Extension(user_id): Extension<i32>,
    Path(id): Path<i32>,
) -> Result<Json<Value>, StatusCode> {
    task::delete_task_handler(user_id, id, &state.pool).await
}