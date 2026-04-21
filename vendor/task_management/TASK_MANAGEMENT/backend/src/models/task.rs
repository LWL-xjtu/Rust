use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use validator::Validate;

// Ensure you import the actual Category struct, not just the module.
// If Category is defined in models/Category.rs as `pub struct Category`, use:

use crate::models::category::Category;
use crate::models::tag::Tag;


#[derive(Serialize, Deserialize, FromRow, Debug)]
pub struct Task {
    pub id: i32,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_id: i32,
    pub category_id: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug, Clone, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum TaskStatus {
    #[sqlx(rename = "pending")]
    Pending,
    #[sqlx(rename = "in_progress")]
    InProgress,
    #[sqlx(rename = "completed")]
    Completed,
    #[sqlx(rename = "low")]
    Low,
    #[sqlx(rename = "medium")]
    Medium,
    #[sqlx(rename = "high")]
    High,
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Pending => write!(f, "pending"),
            TaskStatus::InProgress => write!(f, "in_progress"),
            TaskStatus::Completed => write!(f, "completed"),
            TaskStatus::Low => write!(f, "low"),
            TaskStatus::Medium => write!(f, "medium"),
            TaskStatus::High => write!(f, "high"),
        }
    }
}

#[derive(Deserialize, Validate, Debug)]
pub struct CreateTask {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskStatus,
    pub due_date: Option<DateTime<Utc>>,
    pub category_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
}

#[derive(Deserialize,Validate, Debug)]
pub struct UpdateTask {
    #[validate(length(min = 1, max = 255))]
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub priority: Option<TaskStatus>,
    pub due_date: Option<DateTime<Utc>>,
    pub category_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct TaskWithDetails {
    pub task: Task,
    pub tags: Vec<Tag>,
    pub category: Option<Category>,
}