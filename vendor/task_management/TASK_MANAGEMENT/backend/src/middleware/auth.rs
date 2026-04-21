use axum::{   
    extract::Request,   
    http::{header,StatusCode},
    middleware::Next,
    response::Response,
    body::Body,
};

use std::sync::Arc;

use crate::utils::jwt;
// Import AppState from the new state module
use crate::state::AppState;


pub async fn auth_middleware(
    mut req: Request<Body>,
    next: Next,
) -> Result<Response,StatusCode> 
{
    // Extract state from request extensions
    let state_result = req.extensions().get::<Arc<AppState>>().cloned();
    match state_result {
        Some(state) => {
            // Check for Authorization header
            let auth_header = req
                .headers()
                .get(header::AUTHORIZATION)
                .and_then(|header| header.to_str().ok())
                .and_then(|auth|auth.strip_prefix("Bearer "));

            let token = match auth_header {
                Some(token) => token,
                None => return Err(StatusCode::UNAUTHORIZED),
            };
           
            // Decode the JWT token and extract claims
            match jwt::decode_token(token, &state.jwt_secret) {
                Ok(claims) => {
                    // Parse user ID from claims
                    match claims.sub.parse::<i32>() {
                        Ok(user_id) => {
                            // Add user to request extensions
                            req.extensions_mut().insert(user_id);
                            req.extensions_mut().insert(claims.email.clone());
                            
                            // Call next middleware/handler
                            Ok(next.run(req).await)
                        },
                        Err(_) => return Err(StatusCode::UNAUTHORIZED),
                    }
                },
                Err(_) => return Err(StatusCode::UNAUTHORIZED),
            }
        },
        None => {
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}