use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, TokenData, Validation, errors::Error as JwtError};
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration};
use anyhow::Result;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: i64,
    pub iat: i64,
}

pub fn decode_token(token: &str, secret: &str) -> Result<Claims, JwtError> {
    let validation = Validation::new(Algorithm::HS256);
    let token_data: TokenData<Claims> = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    )?;
    Ok(token_data.claims)
}

pub fn create_token(user_id:i32, email: &str, secret: &str) -> Result<String> {
    let now = Utc::now();
    let exp = now + Duration::hours(24); // Token valid for 24 hours

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        iat: now.timestamp(),
        exp: exp.timestamp(),
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    ).map_err(|e| e.into())   

   
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )?;
    Ok(token_data.claims)
}




