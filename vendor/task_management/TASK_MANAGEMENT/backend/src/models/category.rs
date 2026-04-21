use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Serialize, Deserialize, FromRow, Debug)]
pub struct Category {
    pub id: i32,
    pub name: String,
    pub color: String,
    pub created_at: DateTime<Utc>,   
    pub user_id: i32,
}

#[derive(Deserialize, Validate, Debug)]
pub struct CreateCategory {
    #[validate(length(min = 1, max = 50))]
    pub name: String,  
    pub color: Option<String>,
}

#[derive(Deserialize, Validate, Debug)]
pub struct UpdateCategory {
    #[validate(length(min = 1, max = 50))]
    pub name: Option<String>,
    pub color: Option<String>,
}