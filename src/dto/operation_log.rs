use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::models::operation_log::OperationLog;

#[derive(Debug, Serialize)]
pub struct OperationLogResponse {
    pub id: Uuid,
    pub operator_id: Option<Uuid>,
    pub target_type: String,
    pub target_id: Option<Uuid>,
    pub action: String,
    pub summary: String,
    pub created_at: DateTime<Utc>,
}

impl From<OperationLog> for OperationLogResponse {
    fn from(v: OperationLog) -> Self {
        Self {
            id: v.id,
            operator_id: v.operator_id,
            target_type: v.target_type,
            target_id: v.target_id,
            action: v.action,
            summary: v.summary,
            created_at: v.created_at,
        }
    }
}
