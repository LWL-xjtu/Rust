use axum::{
  Router,
  routing::{get, patch},
};
use sqlx::PgPool;

use crate::handlers::task_handler::{get_tasks, create_task, update_task, delete_task};

pub fn tasks_routes() -> Router<PgPool> {
  Router::new()
    .route("/tasks", get(get_tasks).post(create_task))
    .route("/tasks/:task_id", patch(update_task).delete(delete_task))
}
