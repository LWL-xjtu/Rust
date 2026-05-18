use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Activity {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub activity_type: String,
    pub college: Option<String>,
    pub owner_id: Uuid,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub status: String,
    pub is_deleted: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ActivityMember {
    pub id: Uuid,
    pub activity_id: Uuid,
    pub user_id: Uuid,
    pub member_role: String,
    pub joined_at: DateTime<Utc>,
}
