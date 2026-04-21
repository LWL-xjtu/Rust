use axum::{
    routing::Router,
    extract::Request,
    middleware::Next,
};

use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber;
use dotenv::dotenv;

mod config;
mod models;
mod routes;
mod utils;
mod middleware;
mod handlers;
mod state; // Add the new state module

use config::database;
// Import AppState from the new state module
use state::AppState;

#[tokio::main]
async fn main(){
    // Load .env file
    dotenv().ok();
    
    //initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    //initialize database
    let pool = database::create_pool().await
        .expect("Failed to create database pool");

    let app_state = Arc::new(AppState {
        jwt_secret: std::env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
        pool: pool.clone(),
    });
    
    //build our application with some routes
    let app = Router::new()
        .nest("/api/auth", routes::auth::auth_routes())
        .nest("/api/task", routes::task::task_routes())
        .nest("/api/categories", routes::category::category_routes())
        .nest("/api/tags", routes::tag::tag_routes())
        .layer(axum::middleware::from_fn(move |req: Request, next: Next| {
            let mut req = req;
            req.extensions_mut().insert(app_state.clone());
            next.run(req)
        }))
        .layer(
            ServiceBuilder::new()
                .layer(
                    CorsLayer::new()
                        .allow_origin(Any)
                        .allow_methods(Any)
                        .allow_headers(Any),
                )
        )
        .with_state(app_state.clone());

        //run our app with hyper
        let host = std::env::var("SERVER_HOST").unwrap_or_else(|_|"127.0.0.1".to_string());
        let port = std::env::var("SERVER_PORT").unwrap_or_else(|_|"3000".to_string())
        .parse::<u16>()
        .expect("Invalid port number");
 
        let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port)).await.unwrap();
        tracing::info!("Server running on http://{}:{}", host, port);

        axum::serve(listener, app).await.unwrap();
    
}