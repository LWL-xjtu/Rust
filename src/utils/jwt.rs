use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{errors::AppError, models::user::User};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub role: String,
    pub iat: usize,
    pub exp: usize,
}

pub fn generate_token(user: &User, secret: &str, expires_in_hours: i64) -> Result<String, AppError> {
    let now = Utc::now();
    let exp = now + Duration::hours(expires_in_hours);

    let claims = Claims {
        sub: user.id.to_string(),
        username: user.username.clone(),
        role: user.role.clone(),
        iat: now.timestamp() as usize,
        exp: exp.timestamp() as usize,
    };

    Ok(encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?)
}

pub fn decode_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;
    Ok(data.claims)
}

pub fn parse_user_id(claims: &Claims) -> Result<Uuid, AppError> {
    Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)
}
