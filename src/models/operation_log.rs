use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OperationLog {
    pub id: Uuid,
    pub actor_id: Option<Uuid>,
    pub activity_id: Option<Uuid>,
    pub target_type: String,
    pub target_id: Option<Uuid>,
    pub action: String,
    pub summary: String,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}
