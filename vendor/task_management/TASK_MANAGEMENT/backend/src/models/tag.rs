use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Serialize, Deserialize, FromRow, Debug)]
pub struct Tag {
    pub id: i32,
    pub name: String,
    pub color: String,
    pub created_at: DateTime<Utc>,   
    pub user_id: i32,
}

#[derive(Deserialize, Validate, Debug)]
pub struct CreateTag {
    #[validate(length(min = 1, max = 50))]
    pub name: String,  
    pub color: Option<String>,
}

#[derive(Deserialize, Validate, Debug)]
pub struct UpdateTag {
    #[validate(length(min = 1, max = 50))]
    pub name: Option<String>,
    pub color: Option<String>,
}