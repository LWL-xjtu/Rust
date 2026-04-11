use axum::{routing::get, Router};

use crate::{handlers::user_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new().route("/api/users/me", get(user_handler::me))
}
