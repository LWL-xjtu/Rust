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
