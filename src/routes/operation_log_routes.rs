use axum::{routing::get, Router};

use crate::{handlers::operation_log_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/operation-logs", get(operation_log_handler::list_logs))
        .route(
            "/api/activities/:id/operation-logs",
            get(operation_log_handler::list_activity_logs),
        )
}
