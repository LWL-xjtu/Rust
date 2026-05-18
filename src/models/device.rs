use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Device {
    pub id: Uuid,
    pub name: String,
    pub category: String,
    pub serial_no: String,
    pub location: String,
    pub quantity: i32,
    pub status: String,
    pub description: Option<String>,
    pub is_deleted: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DeviceBorrow {
    pub id: Uuid,
    pub activity_id: Uuid,
    pub device_id: Uuid,
    pub borrower_id: Uuid,
    pub approver_id: Option<Uuid>,
    pub borrow_time: Option<DateTime<Utc>>,
    pub start_time: Option<DateTime<Utc>>,
    pub expected_return_time: DateTime<Utc>,
    pub actual_return_time: Option<DateTime<Utc>>,
    pub quantity: i32,
    pub purpose: Option<String>,
    pub status: String,
    pub remark: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
