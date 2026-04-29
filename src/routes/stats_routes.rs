use axum::{routing::get, Router};

use crate::{handlers::stats_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/stats/overview", get(stats_handler::overview))
        .route(
            "/api/stats/activities/{id}",
            get(stats_handler::activity_stats),
        )
}
