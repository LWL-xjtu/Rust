use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Venue {
    pub id: Uuid,
    pub name: String,
    pub venue_type: String,
    pub location: String,
    pub capacity: i32,
    pub note: Option<String>,
    pub status: String,
    pub is_deleted: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct VenueBooking {
    pub id: Uuid,
    pub activity_id: Uuid,
    pub venue_id: Uuid,
    pub applicant_id: Uuid,
    pub approver_id: Option<Uuid>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub status: String,
    pub reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
