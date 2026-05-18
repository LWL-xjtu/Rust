use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::activity::{Activity, ActivityMember};

#[derive(Debug, Deserialize)]
pub struct CreateActivityRequest {
    pub title: String,
    pub description: Option<String>,
    pub activity_type: Option<String>,
    pub college: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateActivityRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub activity_type: Option<String>,
    pub college: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddActivityMemberRequest {
    pub user_id: Uuid,
    pub member_role: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ActivityResponse {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub activity_type: String,
    pub college: Option<String>,
    pub owner_id: Uuid,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ActivityMemberResponse {
    pub activity_id: Uuid,
    pub user_id: Uuid,
    pub member_role: String,
    pub joined_at: DateTime<Utc>,
}

impl From<Activity> for ActivityResponse {
    fn from(a: Activity) -> Self {
        Self {
            id: a.id,
            title: a.title,
            description: a.description,
            activity_type: a.activity_type,
            college: a.college,
            owner_id: a.owner_id,
            start_time: a.start_time,
            end_time: a.end_time,
            status: a.status,
            created_at: a.created_at,
            updated_at: a.updated_at,
        }
    }
}

impl From<ActivityMember> for ActivityMemberResponse {
    fn from(m: ActivityMember) -> Self {
        Self {
            activity_id: m.activity_id,
            user_id: m.user_id,
            member_role: m.member_role,
            joined_at: m.joined_at,
        }
    }
}
