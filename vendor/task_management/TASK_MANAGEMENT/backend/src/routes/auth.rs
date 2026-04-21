use axum::{
    extract::{State, Json},
    http::StatusCode,
    response::{Json as JsonResponse, IntoResponse},
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use validator::Validate;

use crate::handlers::auth;
use crate::middleware::auth::{auth_middleware};
use crate::models::user::{CreateUser, LoginUser, UserResponse};
// Import AppState from the new state module
use crate::state::AppState;

pub fn auth_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", get(me))
        .route_layer(axum::middleware::from_fn(auth_middleware))
}

async fn register(
    State(state): State<Arc<AppState>>,
    json_payload: Result<Json<CreateUser>, axum::extract::rejection::JsonRejection>,
) -> impl IntoResponse {
    let payload = match json_payload {
        Ok(Json(payload)) => payload,
        Err(e) => {
            eprintln!("JSON parsing error: {}", e);
            return (
                StatusCode::BAD_REQUEST,
                format!("Failed to parse the request body as JSON: {}", e.body_text()),
            ).into_response();
        }
    };

    // Validate input
    match Validate::validate(&payload) {
        Err(_) => return (StatusCode::BAD_REQUEST, "Validation failed").into_response(),
        _ => (),
    }

    match auth::register_handler(payload, &state.jwt_secret, &state.pool).await {
        Ok(response) => response.into_response(),
        Err(status) => {
            eprintln!("Register handler error: {:?}", status);
            (status, "Internal server error").into_response()
        },
    }
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginUser>,
) -> Result<JsonResponse<serde_json::Value>, StatusCode> {
    auth::login_handler(payload, &state.jwt_secret, &state.pool).await
}

async fn me(
    State(state): State<Arc<AppState>>,
    axum::extract::Extension(user_id): axum::extract::Extension<i32>,
    axum::extract::Extension(email): axum::extract::Extension<String>,
) -> Result<JsonResponse<UserResponse>, StatusCode> {
    auth::me_handler(user_id, email, &state.pool).await
}