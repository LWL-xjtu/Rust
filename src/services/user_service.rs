use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppError, models::user::User};

pub async fn list_users(pool: &PgPool) -> Result<Vec<User>, AppError> {
    let users = sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, email, password_hash, role, college, is_active, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(users)
}

pub async fn get_user_by_id(pool: &PgPool, user_id: Uuid) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, email, password_hash, role, college, is_active, created_at, updated_at
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("user not found".to_string()))?;

    Ok(user)
}

pub async fn count_admin_users(pool: &PgPool) -> Result<i64, AppError> {
    let n: i64 =
        sqlx::query_scalar("SELECT COUNT(1) FROM users WHERE role='admin' AND is_active=TRUE")
            .fetch_one(pool)
            .await?;
    Ok(n)
}
