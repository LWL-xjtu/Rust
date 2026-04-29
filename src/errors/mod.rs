use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use thiserror::Error;

use crate::dto::common::ApiResponse;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("bad request: {0}")]
    Validation(String),
    #[error("unauthorized")]
    Unauthorized,
    #[error("forbidden")]
    Forbidden,
    #[error("user already exists")]
    UserAlreadyExists,
    #[error("invalid username or password")]
    InvalidCredentials,
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("invalid state: {0}")]
    InvalidState(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("database error: {0}")]
    Database(String),
    #[error("internal server error: {0}")]
    Internal(String),
}

impl AppError {
    pub fn error_code(&self) -> i32 {
        match self {
            Self::Validation(_) => 4001,
            Self::Unauthorized => 4002,
            Self::UserAlreadyExists => 4003,
            Self::InvalidCredentials => 4004,
            Self::NotFound(_) => 4005,
            Self::Forbidden => 4006,
            Self::Conflict(_) => 4007,
            Self::InvalidState(_) => 4008,
            Self::Database(_) => 5001,
            Self::Internal(_) => 5000,
        }
    }

    fn status_code(&self) -> StatusCode {
        match self {
            Self::Validation(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::Forbidden => StatusCode::FORBIDDEN,
            Self::UserAlreadyExists => StatusCode::CONFLICT,
            Self::InvalidCredentials => StatusCode::UNAUTHORIZED,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::InvalidState(_) => StatusCode::BAD_REQUEST,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Database(_) | Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let body = Json(ApiResponse::<()>::error(
            self.error_code(),
            self.to_string(),
        ));
        (status, body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(value: sqlx::Error) -> Self {
        Self::Database(value.to_string())
    }
}

impl From<argon2::password_hash::Error> for AppError {
    fn from(value: argon2::password_hash::Error) -> Self {
        Self::Internal(value.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(_: jsonwebtoken::errors::Error) -> Self {
        Self::Unauthorized
    }
}
