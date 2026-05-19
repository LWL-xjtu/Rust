use uuid::Uuid;

use crate::{
    config::JwtSection,
    dto::{auth::LoginResponse, user::UserResponse},
    errors::AppError,
    models::user::User,
    state::AppState,
    utils::{jwt, password},
};

pub async fn register(
    state: &AppState,
    username: &str,
    email: Option<&str>,
    password_raw: &str,
    college: Option<String>,
) -> Result<UserResponse, AppError> {
    validate_auth_input(username, password_raw)?;

    let existing = find_user_by_username(state, username).await?;
    if existing.is_some() {
        return Err(AppError::UserAlreadyExists);
    }

    let user_id = Uuid::new_v4();
    let hashed = password::hash_password(password_raw)?;
    let role = "student";

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, username, email, password_hash, role, college, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        RETURNING id, username, email, password_hash, role, college, is_active, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(username)
    .bind(email.map(|v| v.trim().to_string()).filter(|v| !v.is_empty()))
    .bind(hashed)
    .bind(role)
    .bind(
        college
            .map(|v| v.trim().to_string())
            .filter(|v| !v.is_empty()),
    )
    .fetch_one(&state.db)
    .await?;

    Ok(UserResponse::from(user))
}

pub async fn login(
    state: &AppState,
    username: &str,
    password_raw: &str,
) -> Result<LoginResponse, AppError> {
    validate_auth_input(username, password_raw)?;

    let user = find_user_by_username(state, username)
        .await?
        .ok_or(AppError::InvalidCredentials)?;

    let pass_ok = password::verify_password(password_raw, &user.password_hash)?;
    if !pass_ok {
        return Err(AppError::InvalidCredentials);
    }
    if !user.is_active {
        return Err(AppError::Forbidden);
    }

    let token = issue_jwt(&user, &state.jwt)?;

    Ok(LoginResponse {
        token,
        user: UserResponse::from(user),
    })
}

pub async fn find_user_by_username(
    state: &AppState,
    username: &str,
) -> Result<Option<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, email, password_hash, role, college, is_active, created_at, updated_at
        FROM users
        WHERE username = $1
        "#,
    )
    .bind(username)
    .fetch_optional(&state.db)
    .await?;

    Ok(user)
}

fn issue_jwt(user: &User, jwt_config: &JwtSection) -> Result<String, AppError> {
    jwt::generate_token(user, &jwt_config.secret, jwt_config.expires_in_hours)
}

fn validate_auth_input(username: &str, password: &str) -> Result<(), AppError> {
    if username.trim().is_empty() || password.trim().is_empty() {
        return Err(AppError::Validation(
            "username and password cannot be empty".to_string(),
        ));
    }
    if username.len() < 3 || username.len() > 32 {
        return Err(AppError::Validation(
            "username length must be between 3 and 32".to_string(),
        ));
    }
    if password.len() < 6 || password.len() > 128 {
        return Err(AppError::Validation(
            "password length must be between 6 and 128".to_string(),
        ));
    }
    Ok(())
}
