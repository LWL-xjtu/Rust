pub mod auth_routes;
pub mod health_routes;
pub mod user_routes;

use axum::Router;
use tower_http::trace::TraceLayer;

use crate::state::AppState;

pub fn create_router() -> Router<AppState> {
    Router::new()
        .merge(health_routes::router())
        .merge(auth_routes::router())
        .merge(user_routes::router())
        .layer(TraceLayer::new_for_http())
}
