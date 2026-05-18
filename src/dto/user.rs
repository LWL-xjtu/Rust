use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::models::user::User;

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub username: String,
    pub role: String,
    pub college: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(value: User) -> Self {
        Self {
            id: value.id,
            username: value.username,
            role: value.role,
            college: value.college,
            created_at: value.created_at,
        }
    }
}
