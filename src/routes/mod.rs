pub mod auth_routes;
pub mod health_routes;
pub mod user_routes;

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
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
