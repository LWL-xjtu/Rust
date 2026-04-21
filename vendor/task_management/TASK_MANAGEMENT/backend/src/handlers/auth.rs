use axum::{
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
// PgPool is used in function parameters


use crate::models::user::{CreateUser, LoginUser, UserResponse, User};
use crate::utils::{auth, jwt};

pub async fn register_handler(
    payload: CreateUser,
    jwt_secret: &str,
    pool: &sqlx::PgPool,
) -> Result<Json<Value>, StatusCode> {
    // Hash password
    let password_hash = match auth::hash_password(&payload.password) {
        Ok(hash) => hash,
        Err(e) => {
            eprintln!("Password hashing error: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Insert user into database
    let user_record = sqlx::query!(
        r#"
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, password_hash, created_at, updated_at
        "#,
        payload.username,
        payload.email,
        password_hash
    )
    .fetch_one(pool)
    .await
    .map_err(|e| {
        eprintln!("Database error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    
    let user = User {
        id: user_record.id,
        username: user_record.username,
        email: user_record.email,
        password_hash: user_record.password_hash,
        created_at: user_record.created_at.unwrap_or_else(|| chrono::Utc::now()),
        updated_at: user_record.updated_at.unwrap_or_else(|| chrono::Utc::now()),
    };

    // Create JWT token
    let token = match jwt::create_token(user.id, &user.email, jwt_secret) {
        Ok(token) => token,
        Err(e) => {
            eprintln!("Token creation error: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let user_response = UserResponse::from(user);

    Ok(Json(json!({
        "message": "User created successfully",
        "user": user_response,
        "token": token
    })))
}

pub async fn login_handler(
    payload: LoginUser,
    jwt_secret: &str,
    pool: &sqlx::PgPool,
) -> Result<Json<Value>, StatusCode> {

    // Find user by email
    let user_record = sqlx::query!(
        "SELECT * FROM users WHERE email = $1",
        payload.email
    )
    .fetch_optional(pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let user = match user_record {
        Some(record) => User {
            id: record.id,
            username: record.username,
            email: record.email,
            password_hash: record.password_hash,
            created_at: record.created_at.unwrap_or_else(|| chrono::Utc::now()),
            updated_at: record.updated_at.unwrap_or_else(|| chrono::Utc::now()),
        },
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // Verify password
    let is_valid = match auth::verify_password(&payload.password, &user.password_hash) {
        Ok(valid) => valid,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    if !is_valid {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Create JWT token
    let token = match jwt::create_token(user.id, &user.email, jwt_secret) {
        Ok(token) => token,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    let user_response = UserResponse::from(user);

    Ok(Json(json!({
        "message": "Login successful",
        "user": user_response,
        "token": token
    })))
}

pub async fn me_handler(
    user_id: i32,
    _email: String,  // Prefix with underscore to indicate it's intentionally unused
    pool: &sqlx::PgPool,
) -> Result<Json<UserResponse>, StatusCode> {
    // Find user by id
    let user_record = sqlx::query!(
        "SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = $1",
        user_id
    )
    .fetch_optional(pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match user_record {
        Some(record) => {
            let user = User {
                id: record.id,
                username: record.username,
                email: record.email,
                password_hash: record.password_hash,
                created_at: record.created_at.unwrap_or_else(|| chrono::Utc::now()),
                updated_at: record.updated_at.unwrap_or_else(|| chrono::Utc::now()),
            };
            
            let user_response = UserResponse::from(user);
            Ok(Json(user_response))
        },
        None => Err(StatusCode::NOT_FOUND),
    }
}