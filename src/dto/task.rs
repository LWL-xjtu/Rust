use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::task::{Task, TaskProgressLog};

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub activity_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub priority: Option<String>,
    pub due_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub priority: Option<String>,
    pub due_time: Option<DateTime<Utc>>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskStatusRequest {
    pub status: String,
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddTaskProgressLogRequest {
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct TaskResponse {
    pub id: Uuid,
    pub activity_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub creator_id: Uuid,
    pub priority: String,
    pub due_time: Option<DateTime<Utc>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct TaskProgressLogResponse {
    pub id: Uuid,
    pub task_id: Uuid,
    pub user_id: Uuid,
    pub activity_id: Uuid,
    pub old_status: Option<String>,
    pub new_status: Option<String>,
    pub content: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<Task> for TaskResponse {
    fn from(t: Task) -> Self {
        Self {
            id: t.id,
            activity_id: t.activity_id,
            title: t.title,
            description: t.description,
            assignee_id: t.assignee_id,
            creator_id: t.creator_id,
            priority: t.priority,
            due_time: t.due_time,
            status: t.status,
            created_at: t.created_at,
        }
    }
}

impl From<TaskProgressLog> for TaskProgressLogResponse {
    fn from(l: TaskProgressLog) -> Self {
        Self {
            id: l.id,
            task_id: l.task_id,
            user_id: l.user_id,
            activity_id: l.activity_id,
            old_status: l.old_status,
            new_status: l.new_status,
            content: l.content,
            created_at: l.created_at,
        }
    }
}
