use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OperationLog {
    pub id: Uuid,
    pub operator_id: Option<Uuid>,
    pub target_type: String,
    pub target_id: Option<Uuid>,
    pub action: String,
    pub summary: String,
    pub created_at: DateTime<Utc>,
}
