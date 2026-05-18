use axum::{
    routing::{get, post, put},
    Router,
};

use crate::{handlers::venue_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/venues",
            get(venue_handler::list_venues).post(venue_handler::create_venue),
        )
        .route(
            "/api/venues/:id",
            put(venue_handler::update_venue).delete(venue_handler::delete_venue),
        )
        .route(
            "/api/venue-bookings",
            post(venue_handler::create_booking).get(venue_handler::list_bookings),
        )
        .route("/api/venue-bookings/:id", get(venue_handler::get_booking))
        .route(
            "/api/venue-bookings/:id/approve",
            post(venue_handler::approve_booking),
        )
        .route(
            "/api/venue-bookings/:id/reject",
            post(venue_handler::reject_booking),
        )
        .route(
            "/api/venue-bookings/:id/cancel",
            post(venue_handler::cancel_booking),
        )
}
