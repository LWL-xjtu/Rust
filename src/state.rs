use sqlx::PgPool;

use crate::config::JwtSection;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub jwt: JwtSection,
}

impl AppState {
    pub fn new(db: PgPool, jwt: JwtSection) -> Self {
        Self { db, jwt }
    }
}
