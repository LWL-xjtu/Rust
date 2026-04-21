use axum::{routing::get, Router};

use crate::{handlers::health_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health_handler::health))
        .route("/health/live", get(health_handler::live))
        .route("/health/ready", get(health_handler::ready))
}
