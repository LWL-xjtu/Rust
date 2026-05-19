pub mod activity_routes;
pub mod admin_routes;
pub mod auth_routes;
pub mod device_routes;
pub mod health_routes;
pub mod operation_log_routes;
pub mod stats_routes;
pub mod task_routes;
pub mod user_routes;
pub mod venue_routes;

use axum::http::HeaderValue;
use axum::Router;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

use crate::state::AppState;

pub fn create_router(frontend_origin: Option<String>) -> Router<AppState> {
    let cors = match frontend_origin.filter(|s| !s.trim().is_empty()) {
        Some(origin) => match HeaderValue::from_str(&origin) {
            Ok(value) => CorsLayer::new()
                .allow_origin(value)
                .allow_methods(Any)
                .allow_headers(Any),
            Err(_) => CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        },
        None => CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any),
    };

    Router::new()
        .merge(health_routes::router())
        .merge(auth_routes::router())
        .merge(admin_routes::router())
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
