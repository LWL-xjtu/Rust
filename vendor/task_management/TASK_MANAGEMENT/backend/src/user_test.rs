use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;
use bcrypt::{hash, DEFAULT_COST};

#[tokio::main]
async fn main() {
    // Load .env file
    dotenv::dotenv().ok();
    
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    println!("Connecting to database: {}", database_url);
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url).await.unwrap();
        
    println!("Successfully connected to the database!");
    
    // Test creating a user
    let username = "testuser";
    let email = "test@example.com";
    let password = "password123";
    
    // Hash the password
    let password_hash = hash(password, DEFAULT_COST).unwrap();
    println!("Password hashed: {}", password_hash);
    
    // Insert user into database
    let result = sqlx::query!(
        r#"
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, password_hash, created_at, updated_at
        "#,
        username,
        email,
        password_hash
    )
    .fetch_one(&pool)
    .await;
    
    match result {
        Ok(user) => {
            println!("Successfully created user:");
            println!("ID: {}", user.id);
            println!("Username: {}", user.username);
            println!("Email: {}", user.email);
            println!("Created at: {:?}", user.created_at);
        },
        Err(e) => {
            println!("Failed to create user: {}", e);
        }
    }
}