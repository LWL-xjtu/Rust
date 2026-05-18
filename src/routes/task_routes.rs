use axum::{
    routing::{get, post},
    Router,
};

use crate::{handlers::task_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/tasks",
            post(task_handler::create_task).get(task_handler::list_tasks),
        )
        .route(
            "/api/tasks/:id",
            get(task_handler::get_task)
                .put(task_handler::update_task)
                .delete(task_handler::delete_task),
        )
        .route(
            "/api/tasks/:id/status",
            post(task_handler::update_task_status),
        )
        .route(
            "/api/tasks/:id/progress-logs",
            post(task_handler::add_task_progress_log).get(task_handler::get_task_progress_logs),
        )
        .route(
            "/api/activities/:id/tasks",
            get(task_handler::list_activity_tasks),
        )
}
