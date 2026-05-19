use axum::{routing::get, routing::put, Router};

use crate::{handlers::admin_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/admin/users", get(admin_handler::list_users))
        .route(
            "/api/admin/users/:id/role",
            put(admin_handler::update_user_role),
        )
        .route(
            "/api/admin/users/:id/status",
            put(admin_handler::update_user_status),
        )
        .route(
            "/api/admin/users/:id/college",
            put(admin_handler::update_user_college),
        )
}
