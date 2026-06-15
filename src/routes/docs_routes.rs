use axum::{routing::get, Router};

use crate::{handlers::docs_handler, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api-docs/openapi.json", get(docs_handler::openapi_json))
        .route("/swagger-ui", get(docs_handler::swagger_ui))
}
