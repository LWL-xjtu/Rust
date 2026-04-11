use axum::{routing::post, Router};

use crate::{handlers::auth_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/auth/register", post(auth_handler::register))
        .route("/api/auth/login", post(auth_handler::login))
}
