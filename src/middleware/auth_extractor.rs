use async_trait::async_trait;
use axum::{
    extract::{FromRequestParts, State},
    http::{header, request::Parts},
};

use crate::{
    errors::AppError, models::user::User, services::user_service, state::AppState, utils::jwt,
};

pub struct AuthUser(pub User);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
    AppState: axum::extract::FromRef<S>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let State(app_state) = State::<AppState>::from_request_parts(parts, state)
            .await
            .map_err(|_| AppError::Internal("cannot extract app state".to_string()))?;

        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        let token = extract_bearer_token(auth_header)?;
        let claims = jwt::decode_token(token, &app_state.jwt.secret)?;
        let user_id = jwt::parse_user_id(&claims)?;
        let user = user_service::get_user_by_id(&app_state.db, user_id).await?;

        Ok(Self(user))
    }
}

fn extract_bearer_token(header_value: &str) -> Result<&str, AppError> {
    let mut parts = header_value.splitn(2, ' ');
    let scheme = parts.next().unwrap_or_default();
    let token = parts.next().unwrap_or_default();

    if scheme.eq_ignore_ascii_case("bearer") && !token.trim().is_empty() {
        Ok(token.trim())
    } else {
        Err(AppError::Unauthorized)
    }
}
