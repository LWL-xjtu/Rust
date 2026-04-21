use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;

#[tokio::main]
async fn main() {
    // Load .env file
    dotenv::dotenv().ok();
    
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    println!("Connecting to database: {}", database_url);
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url).await;
        
    match pool {
        Ok(_) => println!("Successfully connected to the database!"),
        Err(e) => println!("Failed to connect to the database: {}", e),
    }
}