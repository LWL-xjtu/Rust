use dotenvy::dotenv;
use std::env;

pub struct Config {
  pub database_url: String,
  pub server_address: String,
}

impl Config {
  pub fn from_env() -> Self {
    // expose the envioronment variables
    dotenv().expect("Unable to access .env file");

    // set variables from the envionment variables
    Self {
      database_url: env::var("DATABASE_URL").expect("DATABASE_URL no definida"),
      server_address: std::env::var("SERVER_ADDRESS").unwrap_or("127.0.0.1:3000".to_owned()),
    }
  }
}
