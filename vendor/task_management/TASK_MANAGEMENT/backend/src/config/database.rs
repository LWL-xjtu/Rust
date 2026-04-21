use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;

pub async fn create_pool()->Result<PgPool,sqlx::error::Error>{
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url).await?;
    Ok(pool)
}