use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Task {
    pub id: Uuid,
    pub activity_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub creator_id: Uuid,
    pub priority: String,
    pub due_time: Option<DateTime<Utc>>,
    pub status: String,
    pub is_deleted: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TaskProgressLog {
    pub id: Uuid,
    pub task_id: Uuid,
    pub operator_id: Uuid,
    pub old_status: Option<String>,
    pub new_status: Option<String>,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}
