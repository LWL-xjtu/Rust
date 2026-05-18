use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct OverviewStatsResponse {
    pub activities_count: i64,
    pub venue_bookings_count: i64,
    pub device_borrows_count: i64,
    pub tasks_count: i64,
    pub tasks_done_count: i64,
    pub users_count: i64,
}

#[derive(Debug, Serialize)]
pub struct ActivityStatsResponse {
    pub members_count: i64,
    pub tasks_count: i64,
    pub tasks_done_count: i64,
    pub venue_bookings_count: i64,
    pub device_borrows_count: i64,
    pub recent_logs: Vec<String>,
}

#[derive(Debug, Serialize, Clone, sqlx::FromRow)]
pub struct UserCollegeStatsResponse {
    pub college: String,
    pub user_count: i64,
    pub joined_activity_count: i64,
    pub assigned_task_count: i64,
    pub completed_task_count: i64,
    pub progress_log_count: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct ActivityCollegeStatsResponse {
    pub college: String,
    pub activity_count: i64,
    pub venue_reservation_count: i64,
    pub equipment_borrow_count: i64,
    pub task_count: i64,
    pub completed_task_count: i64,
    pub task_completion_rate: f64,
}

#[derive(Debug, Serialize, Clone)]
pub struct CollegeStatsResponse {
    pub by_activity_college: Vec<ActivityCollegeStatsResponse>,
    pub by_user_college: Vec<UserCollegeStatsResponse>,
}
