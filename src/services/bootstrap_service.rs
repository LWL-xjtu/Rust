use sqlx::PgPool;
use uuid::Uuid;

use crate::{config::AdminSection, errors::AppError, utils::password};

pub async fn ensure_default_admin(pool: &PgPool, admin: &AdminSection) -> Result<(), AppError> {
    let (username, email, password_raw) = match (
        admin.username.as_deref(),
        admin.email.as_deref(),
        admin.password.as_deref(),
    ) {
        (Some(u), Some(e), Some(p)) => (u.trim(), e.trim(), p),
        _ => {
            tracing::info!(
                "default admin bootstrap skipped because ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD are not all configured"
            );
            return Ok(());
        }
    };

    let existing_admin = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(1) FROM users WHERE role = 'admin' AND is_active = TRUE",
    )
    .fetch_one(pool)
    .await?;

    if existing_admin > 0 {
        tracing::info!(
            "default admin bootstrap skipped because active admin already exists (count={})",
            existing_admin
        );
        return Ok(());
    }

    let existing_email =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM users WHERE email = $1")
            .bind(email)
            .fetch_one(pool)
            .await?;
    if existing_email > 0 {
        tracing::warn!(
            "default admin bootstrap skipped because email already exists but no active admin found: {}",
            email
        );
        return Ok(());
    }

    let existing_username =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM users WHERE username = $1")
            .bind(username)
            .fetch_one(pool)
            .await?;
    if existing_username > 0 {
        tracing::warn!(
            "default admin bootstrap skipped because username already exists but no active admin found: {}",
            username
        );
        return Ok(());
    }

    let password_hash = password::hash_password(password_raw)?;
    let user_id = Uuid::new_v4();

    sqlx::query(
        r#"
        INSERT INTO users (id, username, email, password_hash, role, college, is_active)
        VALUES ($1, $2, $3, $4, 'admin', NULL, TRUE)
        "#,
    )
    .bind(user_id)
    .bind(username)
    .bind(email)
    .bind(password_hash)
    .execute(pool)
    .await?;

    tracing::info!(
        "default admin bootstrap created admin user successfully: username={}, email={}",
        username,
        email
    );
    Ok(())
}
