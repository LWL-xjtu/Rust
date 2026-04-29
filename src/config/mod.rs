use std::{env, num::ParseIntError};

use thiserror::Error;

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub app: AppSection,
    pub database: DatabaseSection,
    pub jwt: JwtSection,
    pub cors: CorsSection,
}

#[derive(Debug, Clone)]
pub struct AppSection {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone)]
pub struct DatabaseSection {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone)]
pub struct JwtSection {
    pub secret: String,
    pub expires_in_hours: i64,
}

#[derive(Debug, Clone)]
pub struct CorsSection {
    pub frontend_origin: Option<String>,
}

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("missing env var: {0}")]
    MissingVar(String),
    #[error("invalid env value: {0}")]
    InvalidValue(String),
}

impl AppConfig {
    pub fn from_env() -> Result<Self, ConfigError> {
        let host = env::var("APP_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let port = parse_env_or_default("APP_PORT", 8080_u16)?;
        let database_url = env::var("DATABASE_URL")
            .map_err(|_| ConfigError::MissingVar("DATABASE_URL".to_string()))?;
        let max_connections = parse_env_or_default("DATABASE_MAX_CONNECTIONS", 10_u32)?;
        let jwt_secret = env::var("JWT_SECRET")
            .map_err(|_| ConfigError::MissingVar("JWT_SECRET".to_string()))?;
        let expires_in_hours = parse_env_or_default("JWT_EXPIRES_IN_HOURS", 24_i64)?;
        let frontend_origin = env::var("FRONTEND_ORIGIN")
            .ok()
            .filter(|v| !v.trim().is_empty());

        Ok(Self {
            app: AppSection { host, port },
            database: DatabaseSection {
                url: database_url,
                max_connections,
            },
            jwt: JwtSection {
                secret: jwt_secret,
                expires_in_hours,
            },
            cors: CorsSection { frontend_origin },
        })
    }
}

fn parse_env_or_default<T>(key: &str, default: T) -> Result<T, ConfigError>
where
    T: std::str::FromStr<Err = ParseIntError>,
{
    match env::var(key) {
        Ok(v) => v
            .parse::<T>()
            .map_err(|_| ConfigError::InvalidValue(key.to_string())),
        Err(_) => Ok(default),
    }
}
