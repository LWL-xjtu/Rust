use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppError, models::user::User};

pub async fn get_user_by_id(pool: &PgPool, user_id: Uuid) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, password_hash, role, created_at, updated_at
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
