use uuid::Uuid;

use crate::{
    dto::stats::{ActivityStatsResponse, CollegeStatsResponse, OverviewStatsResponse},
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
) -> Result<Vec<CollegeStatsResponse>, AppError> {
    let scope_college = college_scope_for_role(&auth.0.role, auth.0.college.as_deref());

    let rows = sqlx::query_as::<_, CollegeStatsRow>(
        r#"
        WITH college_users AS (
            SELECT id, COALESCE(NULLIF(BTRIM(college), ''), '未填写') AS college
            FROM users
        ),
        base AS (
            SELECT DISTINCT college FROM college_users
        )
        SELECT
            b.college,
            (SELECT COUNT(1) FROM college_users cu WHERE cu.college = b.college) AS member_count,
            (SELECT COUNT(DISTINCT m.activity_id)
             FROM activity_members m
             JOIN college_users cu ON cu.id = m.user_id
             JOIN activities a ON a.id = m.activity_id AND a.is_deleted = FALSE
             WHERE cu.college = b.college) AS activity_count,
            (SELECT COUNT(1)
             FROM tasks t
             JOIN college_users cu ON cu.id = t.assignee_id
             WHERE t.is_deleted = FALSE AND cu.college = b.college) AS task_count,
            (SELECT COUNT(1)
             FROM tasks t
             JOIN college_users cu ON cu.id = t.assignee_id
             WHERE t.is_deleted = FALSE AND t.status = 'completed' AND cu.college = b.college) AS completed_task_count,
            (SELECT COUNT(DISTINCT vb.id)
             FROM venue_bookings vb
             JOIN activity_members m ON m.activity_id = vb.activity_id
             JOIN college_users cu ON cu.id = m.user_id
             WHERE cu.college = b.college) AS venue_reservation_count,
            (SELECT COUNT(DISTINCT db.id)
             FROM device_borrows db
             JOIN activity_members m ON m.activity_id = db.activity_id
             JOIN college_users cu ON cu.id = m.user_id
             WHERE cu.college = b.college) AS equipment_borrow_count,
            (SELECT COUNT(1)
             FROM task_progress_logs pl
             JOIN college_users cu ON cu.id = pl.user_id
             WHERE cu.college = b.college) AS progress_log_count
        FROM base b
        WHERE ($1::TEXT IS NULL OR b.college = $1)
        ORDER BY b.college
        "#,
    )
    .bind(scope_college)
    .fetch_all(&state.db)
    .await?;

    Ok(rows.into_iter().map(CollegeStatsResponse::from).collect())
}

#[derive(sqlx::FromRow)]
struct CollegeStatsRow {
    college: String,
    member_count: i64,
    activity_count: i64,
    task_count: i64,
    completed_task_count: i64,
    venue_reservation_count: i64,
    equipment_borrow_count: i64,
    progress_log_count: i64,
}

impl From<CollegeStatsRow> for CollegeStatsResponse {
    fn from(v: CollegeStatsRow) -> Self {
        let task_completion_rate = completion_rate(v.completed_task_count, v.task_count);
        Self {
            college: v.college,
            member_count: v.member_count,
            activity_count: v.activity_count,
            task_count: v.task_count,
            completed_task_count: v.completed_task_count,
            task_completion_rate,
            venue_reservation_count: v.venue_reservation_count,
            equipment_borrow_count: v.equipment_borrow_count,
            progress_log_count: v.progress_log_count,
        }
    }
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
        assert_eq!(normalize_college(Some("")), "未填写");
        assert_eq!(normalize_college(Some("  ")), "未填写");
    }

    #[test]
    fn completion_rate_handles_zero_total() {
        assert_eq!(completion_rate(0, 0), 0.0);
        assert_eq!(completion_rate(2, 3), 66.67);
    }

    #[test]
    fn student_only_sees_own_college_scope() {
        assert_eq!(
            college_scope_for_role("student", Some("钱学森书院")),
            Some("钱学森书院".to_string())
        );
        assert_eq!(
            college_scope_for_role("student", Some(" ")),
            Some("未填写".to_string())
        );
    }

    #[test]
    fn teacher_and_admin_can_see_all_colleges() {
        assert_eq!(college_scope_for_role("teacher", Some("A")), None);
        assert_eq!(college_scope_for_role("admin", Some("A")), None);
    }
}
