use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::{handlers::activity_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/activities",
            post(activity_handler::create).get(activity_handler::list),
        )
        .route(
            "/api/activities/:id",
            get(activity_handler::get)
                .put(activity_handler::update)
                .delete(activity_handler::delete),
        )
        .route(
            "/api/activities/:id/members",
            get(activity_handler::list_members).post(activity_handler::add_member),
        )
        .route(
            "/api/activities/:id/members/:user_id",
            delete(activity_handler::remove_member),
        )
}
