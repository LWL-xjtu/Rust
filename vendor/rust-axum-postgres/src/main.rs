mod config;
mod db;
mod server;
mod models;
mod handlers;
mod routes;

use config::Config;
use db::postgres::connect_db;
use server::start_server;
use routes::app::app_router;

#[tokio::main]
async fn main() {
  // envioronment variables
  let config = Config::from_env();

  // create the database pool
  let db_pool = connect_db(&config.database_url).await;

  // compose the routes
  let app = app_router(db_pool);

  start_server(app, config.server_address).await;
}
