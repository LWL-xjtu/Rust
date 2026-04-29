use axum::{
    routing::{get, post},
    Router,
};

use crate::{handlers::device_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/devices",
            get(device_handler::list_devices).post(device_handler::create_device),
        )
        .route(
            "/api/devices/{id}",
            get(device_handler::get_device)
                .put(device_handler::update_device)
                .delete(device_handler::delete_device),
        )
        .route(
            "/api/device-borrows",
            post(device_handler::create_borrow).get(device_handler::list_borrows),
        )
        .route("/api/device-borrows/{id}", get(device_handler::get_borrow))
        .route(
            "/api/device-borrows/{id}/approve",
            post(device_handler::approve_borrow),
        )
        .route(
            "/api/device-borrows/{id}/reject",
            post(device_handler::reject_borrow),
        )
        .route(
            "/api/device-borrows/{id}/checkout",
            post(device_handler::checkout_borrow),
        )
        .route(
            "/api/device-borrows/{id}/return",
            post(device_handler::return_borrow),
        )
        .route(
            "/api/device-borrows/{id}/cancel",
            post(device_handler::cancel_borrow),
        )
}
