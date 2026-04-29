pub mod activity_routes;
pub mod auth_routes;
pub mod device_routes;
pub mod health_routes;
pub mod operation_log_routes;
pub mod stats_routes;
pub mod task_routes;
pub mod user_routes;
pub mod venue_routes;

use axum::Router;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

use crate::state::AppState;

pub fn create_router() -> Router<AppState> {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .merge(health_routes::router())
        .merge(auth_routes::router())
        .merge(user_routes::router())
        .merge(activity_routes::router())
        .merge(venue_routes::router())
        .merge(device_routes::router())
        .merge(task_routes::router())
        .merge(operation_log_routes::router())
        .merge(stats_routes::router())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
