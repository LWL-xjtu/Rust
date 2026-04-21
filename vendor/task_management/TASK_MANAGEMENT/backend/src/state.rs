use sqlx::PgPool;

pub struct AppState {
    pub jwt_secret: String,
    pub pool: PgPool,
}