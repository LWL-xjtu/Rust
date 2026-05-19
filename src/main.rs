mod config;
mod dto;
mod errors;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;
mod state;
mod utils;

use std::net::SocketAddr;

use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{config::AppConfig, state::AppState};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    init_tracing();

    let config = AppConfig::from_env().expect("failed to load app config");
    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await
        .expect("failed to connect to postgres");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("failed to run migrations");

    services::bootstrap_service::ensure_default_admin(&pool, &config.admin)
        .await
        .expect("failed to initialize default admin");

    let app_state = AppState::new(pool, config.jwt.clone());
    let app = routes::create_router(config.cors.frontend_origin.clone()).with_state(app_state);
    let addr = SocketAddr::new(
        config.app.host.parse().expect("invalid APP_HOST"),
        config.app.port,
    );

    tracing::info!("server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind tcp listener");

    axum::serve(listener, app)
        .await
        .expect("failed to start server");
}

fn init_tracing() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,campus_collab_backend=debug,sqlx=warn".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}
