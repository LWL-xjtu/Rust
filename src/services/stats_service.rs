use uuid::Uuid;

use crate::{
    dto::stats::{ActivityStatsResponse, OverviewStatsResponse},
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    services::activity_service,
    state::AppState,
};

pub async fn overview(
    state: &AppState,
    _auth: &AuthUser,
) -> Result<OverviewStatsResponse, AppError> {
    let activities_count: i64 =
        sqlx::query_scalar("SELECT COUNT(1) FROM activities WHERE is_deleted=FALSE")
            .fetch_one(&state.db)
            .await?;
    let venue_bookings_count: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM venue_bookings")
        .fetch_one(&state.db)
        .await?;
    let device_borrows_count: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM device_borrows")
        .fetch_one(&state.db)
        .await?;
    let tasks_count: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM tasks WHERE is_deleted=FALSE")
        .fetch_one(&state.db)
        .await?;
    let tasks_done_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1) FROM tasks WHERE status='completed' AND is_deleted=FALSE",
    )
    .fetch_one(&state.db)
    .await?;
    let users_count: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM users")
        .fetch_one(&state.db)
        .await?;

    Ok(OverviewStatsResponse {
        activities_count,
        venue_bookings_count,
        device_borrows_count,
        tasks_count,
        tasks_done_count,
        users_count,
    })
}

pub async fn activity_stats(
    state: &AppState,
    auth: &AuthUser,
    activity_id: Uuid,
) -> Result<ActivityStatsResponse, AppError> {
    activity_service::ensure_activity_read_access(state, auth, activity_id).await?;

    let members_count: i64 =
        sqlx::query_scalar("SELECT COUNT(1) FROM activity_members WHERE activity_id=$1")
            .bind(activity_id)
            .fetch_one(&state.db)
            .await?;
    let tasks_count: i64 =
        sqlx::query_scalar("SELECT COUNT(1) FROM tasks WHERE activity_id=$1 AND is_deleted=FALSE")
            .bind(activity_id)
            .fetch_one(&state.db)
            .await?;
    let tasks_done_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1) FROM tasks WHERE activity_id=$1 AND status='completed' AND is_deleted=FALSE",
    )
    .bind(activity_id)
    .fetch_one(&state.db)
    .await?;
    let venue_bookings_count: i64 =
        sqlx::query_scalar("SELECT COUNT(1) FROM venue_bookings WHERE activity_id=$1")
            .bind(activity_id)
            .fetch_one(&state.db)
            .await?;
    let device_borrows_count: i64 =
        sqlx::query_scalar("SELECT COUNT(1) FROM device_borrows WHERE activity_id=$1")
            .bind(activity_id)
            .fetch_one(&state.db)
            .await?;

    let recent_logs = sqlx::query_scalar::<_, String>(
        "SELECT summary FROM operation_logs WHERE activity_id=$1 ORDER BY created_at DESC LIMIT 5",
    )
    .bind(activity_id)
    .fetch_all(&state.db)
    .await?;

    Ok(ActivityStatsResponse {
        members_count,
        tasks_count,
        tasks_done_count,
        venue_bookings_count,
        device_borrows_count,
        recent_logs,
    })
}
