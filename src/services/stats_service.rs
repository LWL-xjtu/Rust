use uuid::Uuid;

use crate::{
    dto::stats::{
        ActivityCollegeStatsResponse, ActivityStatsResponse, CollegeStatsResponse,
        OverviewStatsResponse, UserCollegeStatsResponse,
    },
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

pub async fn college_stats(
    state: &AppState,
    auth: &AuthUser,
) -> Result<CollegeStatsResponse, AppError> {
    let scope_college = college_scope_for_role(&auth.0.role, auth.0.college.as_deref());

    let by_user_college = sqlx::query_as::<_, UserCollegeStatsResponse>(
        r#"
        WITH college_users AS (
            SELECT id, COALESCE(NULLIF(BTRIM(college), ''), '未填写') AS college
            FROM users
        ),
        base AS (SELECT DISTINCT college FROM college_users)
        SELECT
            b.college,
            (SELECT COUNT(1) FROM college_users cu WHERE cu.college = b.college) AS user_count,
            (SELECT COUNT(DISTINCT m.activity_id)
             FROM activity_members m JOIN college_users cu ON cu.id=m.user_id
             JOIN activities a ON a.id=m.activity_id AND a.is_deleted=FALSE
             WHERE cu.college=b.college) AS joined_activity_count,
            (SELECT COUNT(1)
             FROM tasks t JOIN college_users cu ON cu.id=t.assignee_id
             WHERE t.is_deleted=FALSE AND cu.college=b.college) AS assigned_task_count,
            (SELECT COUNT(1)
             FROM tasks t JOIN college_users cu ON cu.id=t.assignee_id
             WHERE t.is_deleted=FALSE AND t.status='completed' AND cu.college=b.college) AS completed_task_count,
            (SELECT COUNT(1)
             FROM task_progress_logs pl JOIN college_users cu ON cu.id=pl.user_id
             WHERE cu.college=b.college) AS progress_log_count
        FROM base b
        WHERE ($1::TEXT IS NULL OR b.college=$1)
        ORDER BY b.college
        "#,
    )
    .bind(scope_college.clone())
    .fetch_all(&state.db)
    .await?;

    let by_activity_college_rows = sqlx::query_as::<_, ActivityCollegeStatsRow>(
        r#"
        WITH activity_base AS (
            SELECT id, COALESCE(NULLIF(BTRIM(college), ''), '未填写') AS college
            FROM activities
            WHERE is_deleted=FALSE
        ),
        colleges AS (SELECT DISTINCT college FROM activity_base)
        SELECT
            c.college,
            (SELECT COUNT(1) FROM activity_base ab WHERE ab.college=c.college) AS activity_count,
            (SELECT COUNT(1) FROM venue_bookings vb JOIN activity_base ab ON ab.id=vb.activity_id WHERE ab.college=c.college) AS venue_reservation_count,
            (SELECT COUNT(1) FROM device_borrows db JOIN activity_base ab ON ab.id=db.activity_id WHERE ab.college=c.college) AS equipment_borrow_count,
            (SELECT COUNT(1) FROM tasks t JOIN activity_base ab ON ab.id=t.activity_id WHERE t.is_deleted=FALSE AND ab.college=c.college) AS task_count,
            (SELECT COUNT(1) FROM tasks t JOIN activity_base ab ON ab.id=t.activity_id WHERE t.is_deleted=FALSE AND t.status='completed' AND ab.college=c.college) AS completed_task_count
        FROM colleges c
        WHERE ($1::TEXT IS NULL OR c.college=$1)
        ORDER BY c.college
        "#,
    )
    .bind(scope_college)
    .fetch_all(&state.db)
    .await?;

    let by_activity_college = by_activity_college_rows
        .into_iter()
        .map(|v| ActivityCollegeStatsResponse {
            college: v.college,
            activity_count: v.activity_count,
            venue_reservation_count: v.venue_reservation_count,
            equipment_borrow_count: v.equipment_borrow_count,
            task_count: v.task_count,
            completed_task_count: v.completed_task_count,
            task_completion_rate: completion_rate(v.completed_task_count, v.task_count),
        })
        .collect();

    Ok(CollegeStatsResponse {
        by_activity_college,
        by_user_college,
    })
}

#[derive(sqlx::FromRow)]
struct ActivityCollegeStatsRow {
    college: String,
    activity_count: i64,
    venue_reservation_count: i64,
    equipment_borrow_count: i64,
    task_count: i64,
    completed_task_count: i64,
}

fn normalize_college(value: Option<&str>) -> String {
    value
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .unwrap_or("未填写")
        .to_string()
}

fn completion_rate(completed: i64, total: i64) -> f64 {
    if total <= 0 {
        0.0
    } else {
        ((completed as f64) * 10000.0 / (total as f64)).round() / 100.0
    }
}

fn college_scope_for_role(role: &str, college: Option<&str>) -> Option<String> {
    if role == "admin" || role == "teacher" {
        None
    } else {
        Some(normalize_college(college))
    }
}

#[cfg(test)]
mod tests {
    use super::{college_scope_for_role, completion_rate, normalize_college};

    #[test]
    fn normalizes_empty_college_to_default() {
        assert_eq!(normalize_college(None), "未填写");
    }
    #[test]
    fn completion_rate_handles_zero_total() {
        assert_eq!(completion_rate(0, 0), 0.0);
    }
    #[test]
    fn role_scope_works() {
        assert_eq!(college_scope_for_role("admin", Some("A")), None);
        assert_eq!(
            college_scope_for_role("student", Some("A")),
            Some("A".to_string())
        );
    }
}
