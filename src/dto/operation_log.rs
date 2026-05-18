use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::models::operation_log::OperationLog;

#[derive(Debug, Serialize)]
pub struct OperationLogResponse {
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

impl From<OperationLog> for OperationLogResponse {
    fn from(v: OperationLog) -> Self {
        Self {
            id: v.id,
            actor_id: v.actor_id,
            activity_id: v.activity_id,
            target_type: v.target_type,
            target_id: v.target_id,
            action: v.action,
            summary: v.summary,
            metadata: v.metadata,
            created_at: v.created_at,
        }
    }
}
