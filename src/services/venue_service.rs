use uuid::Uuid;

use crate::{
    dto::venue::{
        ActionReasonRequest, CreateVenueBookingRequest, CreateVenueRequest, UpdateVenueRequest,
        VenueBookingResponse, VenueResponse,
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    models::venue::{Venue, VenueBooking},
    services::{activity_service, operation_log_service},
    state::AppState,
};
use sqlx::FromRow;

pub async fn list_venues(state: &AppState) -> Result<Vec<VenueResponse>, AppError> {
    let rows = sqlx::query_as::<_, Venue>(
        "SELECT id,name,venue_type,location,capacity,note,status,is_deleted,created_at,updated_at FROM venues WHERE is_deleted=FALSE ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await?;
    Ok(rows.into_iter().map(VenueResponse::from).collect())
}

pub async fn create_venue(
    state: &AppState,
    auth: &AuthUser,
    req: CreateVenueRequest,
) -> Result<VenueResponse, AppError> {
    operation_log_service::ensure_teacher_or_admin(&auth.0.role)?;
    let normalized_name = req.name.trim();
    let normalized_location = req.location.trim();
    if normalized_name.is_empty() || normalized_location.is_empty() {
        return Err(AppError::Validation("场地名称和位置不能为空".to_string()));
    }

    let duplicate_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(1)
           FROM venues
           WHERE is_deleted=FALSE
             AND lower(trim(name)) = lower(trim($1))
             AND lower(trim(location)) = lower(trim($2))"#,
    )
    .bind(normalized_name)
    .bind(normalized_location)
    .fetch_one(&state.db)
    .await?;
    if duplicate_count > 0 {
        return Err(AppError::Conflict(
            "已存在同名且同位置的场地，请勿重复新增".to_string(),
        ));
    }

    let venue = sqlx::query_as::<_, Venue>(
        r#"INSERT INTO venues (id,name,venue_type,location,capacity,note,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id,name,venue_type,location,capacity,note,status,is_deleted,created_at,updated_at"#,
    )
    .bind(Uuid::new_v4())
    .bind(normalized_name)
    .bind(req.venue_type.unwrap_or_else(|| "other".to_string()))
    .bind(normalized_location)
    .bind(req.capacity)
    .bind(req.note)
    .bind(req.status.unwrap_or_else(|| "available".to_string()))
    .fetch_one(&state.db)
    .await?;
    Ok(venue.into())
}

pub async fn update_venue(
    state: &AppState,
    auth: &AuthUser,
    venue_id: Uuid,
    req: UpdateVenueRequest,
) -> Result<VenueResponse, AppError> {
    operation_log_service::ensure_teacher_or_admin(&auth.0.role)?;

    let current = sqlx::query_as::<_, Venue>(
        "SELECT id,name,venue_type,location,capacity,note,status,is_deleted,created_at,updated_at FROM venues WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(venue_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("venue not found".to_string()))?;

    let next_name = req.name.unwrap_or(current.name);
    let next_location = req.location.unwrap_or(current.location);
    let duplicate_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(1)
           FROM venues
           WHERE is_deleted=FALSE
             AND id <> $1
             AND lower(trim(name)) = lower(trim($2))
             AND lower(trim(location)) = lower(trim($3))"#,
    )
    .bind(venue_id)
    .bind(next_name.trim())
    .bind(next_location.trim())
    .fetch_one(&state.db)
    .await?;
    if duplicate_count > 0 {
        return Err(AppError::Conflict(
            "已存在同名且同位置的场地，请修改后再保存".to_string(),
        ));
    }

    let updated = sqlx::query_as::<_, Venue>(
        r#"UPDATE venues SET name=$2,venue_type=$3,location=$4,capacity=$5,note=$6,status=$7
           WHERE id=$1
           RETURNING id,name,venue_type,location,capacity,note,status,is_deleted,created_at,updated_at"#,
    )
    .bind(venue_id)
    .bind(next_name.trim().to_string())
    .bind(req.venue_type.unwrap_or(current.venue_type))
    .bind(next_location.trim().to_string())
    .bind(req.capacity.unwrap_or(current.capacity))
    .bind(req.note.or(current.note))
    .bind(req.status.unwrap_or(current.status))
    .fetch_one(&state.db)
    .await?;
    Ok(updated.into())
}

pub async fn delete_venue(
    state: &AppState,
    auth: &AuthUser,
    venue_id: Uuid,
) -> Result<(), AppError> {
    operation_log_service::ensure_admin(&auth.0.role)?;

    let affected = sqlx::query(
        "UPDATE venues SET is_deleted=TRUE, status='unavailable' WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(venue_id)
    .execute(&state.db)
    .await?
    .rows_affected();
    if affected == 0 {
        return Err(AppError::NotFound("venue not found".to_string()));
    }
    Ok(())
}

pub async fn create_booking(
    state: &AppState,
    auth: &AuthUser,
    req: CreateVenueBookingRequest,
) -> Result<VenueBookingResponse, AppError> {
    activity_service::ensure_activity_read_access(state, auth, req.activity_id).await?;

    if req.end_time <= req.start_time {
        return Err(AppError::Validation(
            "end_time must be greater than start_time".to_string(),
        ));
    }

    let conflict: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(1)
           FROM venue_bookings
           WHERE venue_id=$1 AND status='approved'
             AND start_time < $3 AND end_time > $2"#,
    )
    .bind(req.venue_id)
    .bind(req.start_time)
    .bind(req.end_time)
    .fetch_one(&state.db)
    .await?;

    if conflict > 0 {
        return Err(AppError::Conflict("预约时间冲突".to_string()));
    }

    let booking = sqlx::query_as::<_, VenueBooking>(
        r#"INSERT INTO venue_bookings (id,activity_id,venue_id,applicant_id,start_time,end_time,status,reason)
           VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)
           RETURNING id,activity_id,venue_id,applicant_id,approver_id,start_time,end_time,status,reason,created_at,updated_at"#,
    )
    .bind(Uuid::new_v4())
    .bind(req.activity_id)
    .bind(req.venue_id)
    .bind(auth.0.id)
    .bind(req.start_time)
    .bind(req.end_time)
    .bind(req.reason)
    .fetch_one(&state.db)
    .await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(booking.activity_id),
        "venue_booking",
        Some(booking.id),
        "apply",
        format!(
            "user {} applied venue booking {}",
            auth.0.username, booking.id
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(booking.into())
}

pub async fn list_bookings(
    state: &AppState,
    auth: &AuthUser,
) -> Result<Vec<VenueBookingResponse>, AppError> {
    let rows: Vec<VenueBookingView> = if auth.0.role == "admin" || auth.0.role == "teacher" {
        sqlx::query_as::<_, VenueBookingView>(
            r#"SELECT vb.id,vb.activity_id,vb.venue_id,vb.applicant_id,vb.approver_id,vb.start_time,vb.end_time,vb.status,vb.reason,vb.created_at,
               a.title AS activity_name, v.name AS venue_name, u.username AS applicant_name
               FROM venue_bookings vb
               LEFT JOIN activities a ON a.id = vb.activity_id
               LEFT JOIN venues v ON v.id = vb.venue_id
               LEFT JOIN users u ON u.id = vb.applicant_id
               ORDER BY vb.created_at DESC"#,
        )
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, VenueBookingView>(
            r#"SELECT vb.id,vb.activity_id,vb.venue_id,vb.applicant_id,vb.approver_id,vb.start_time,vb.end_time,vb.status,vb.reason,vb.created_at,
               a.title AS activity_name, v.name AS venue_name, u.username AS applicant_name
               FROM venue_bookings vb
               LEFT JOIN activity_members m ON vb.activity_id=m.activity_id
               LEFT JOIN activities a ON vb.activity_id=a.id
               LEFT JOIN venues v ON v.id = vb.venue_id
               LEFT JOIN users u ON u.id = vb.applicant_id
               WHERE vb.applicant_id=$1 OR a.owner_id=$1 OR m.user_id=$1
               ORDER BY vb.created_at DESC"#,
        )
        .bind(auth.0.id)
        .fetch_all(&state.db)
        .await?
    };

    Ok(rows.into_iter().map(VenueBookingResponse::from).collect())
}

pub async fn get_booking(
    state: &AppState,
    auth: &AuthUser,
    booking_id: Uuid,
) -> Result<VenueBookingResponse, AppError> {
    let booking = sqlx::query_as::<_, VenueBookingView>(
        r#"SELECT vb.id,vb.activity_id,vb.venue_id,vb.applicant_id,vb.approver_id,vb.start_time,vb.end_time,vb.status,vb.reason,vb.created_at,
           a.title AS activity_name, v.name AS venue_name, u.username AS applicant_name
           FROM venue_bookings vb
           LEFT JOIN activities a ON a.id = vb.activity_id
           LEFT JOIN venues v ON v.id = vb.venue_id
           LEFT JOIN users u ON u.id = vb.applicant_id
           WHERE vb.id=$1"#,
    )
    .bind(booking_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("booking not found".to_string()))?;

    if auth.0.role != "admin" {
        activity_service::ensure_activity_read_access(state, auth, booking.activity_id).await?;
    }
    Ok(booking.into())
}

pub async fn approve_booking(
    state: &AppState,
    auth: &AuthUser,
    booking_id: Uuid,
) -> Result<VenueBookingResponse, AppError> {
    operation_log_service::ensure_teacher_or_admin(&auth.0.role)?;

    let booking = sqlx::query_as::<_, VenueBooking>(
        "SELECT id,activity_id,venue_id,applicant_id,approver_id,start_time,end_time,status,reason,created_at,updated_at FROM venue_bookings WHERE id=$1",
    )
    .bind(booking_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("booking not found".to_string()))?;

    if booking.status != "pending" {
        return Err(AppError::InvalidState(
            "only pending booking can be approved".to_string(),
        ));
    }

    let conflict: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(1)
           FROM venue_bookings
           WHERE venue_id=$1 AND status='approved' AND id <> $2
             AND start_time < $4 AND end_time > $3"#,
    )
    .bind(booking.venue_id)
    .bind(booking.id)
    .bind(booking.start_time)
    .bind(booking.end_time)
    .fetch_one(&state.db)
    .await?;

    if conflict > 0 {
        return Err(AppError::Conflict("预约时间冲突".to_string()));
    }

    let updated = sqlx::query_as::<_, VenueBooking>(
        r#"UPDATE venue_bookings SET status='approved', approver_id=$2 WHERE id=$1
           RETURNING id,activity_id,venue_id,applicant_id,approver_id,start_time,end_time,status,reason,created_at,updated_at"#,
    )
    .bind(booking_id)
    .bind(auth.0.id)
    .fetch_one(&state.db)
    .await?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(updated.activity_id),
        "venue_booking",
        Some(updated.id),
        "approve",
        format!(
            "user {} approved venue booking {}",
            auth.0.username, updated.id
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(updated.into())
}

#[derive(Debug, FromRow)]
struct VenueBookingView {
    id: Uuid,
    activity_id: Uuid,
    venue_id: Uuid,
    applicant_id: Uuid,
    approver_id: Option<Uuid>,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: chrono::DateTime<chrono::Utc>,
    status: String,
    reason: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    activity_name: Option<String>,
    venue_name: Option<String>,
    applicant_name: Option<String>,
}

impl From<VenueBookingView> for VenueBookingResponse {
    fn from(v: VenueBookingView) -> Self {
        Self {
            id: v.id,
            activity_id: v.activity_id,
            venue_id: v.venue_id,
            applicant_id: v.applicant_id,
            activity_name: v.activity_name,
            venue_name: v.venue_name,
            applicant_name: v.applicant_name,
            approver_id: v.approver_id,
            start_time: v.start_time,
            end_time: v.end_time,
            status: v.status,
            reason: v.reason,
            created_at: v.created_at,
        }
    }
}

pub async fn reject_booking(
    state: &AppState,
    auth: &AuthUser,
    booking_id: Uuid,
    req: ActionReasonRequest,
) -> Result<VenueBookingResponse, AppError> {
    operation_log_service::ensure_teacher_or_admin(&auth.0.role)?;

    let updated = sqlx::query_as::<_, VenueBooking>(
        r#"UPDATE venue_bookings SET status='rejected', approver_id=$2, reason=COALESCE($3, reason)
           WHERE id=$1 AND status='pending'
           RETURNING id,activity_id,venue_id,applicant_id,approver_id,start_time,end_time,status,reason,created_at,updated_at"#,
    )
    .bind(booking_id)
    .bind(auth.0.id)
    .bind(req.reason)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::InvalidState("only pending booking can be rejected".to_string()))?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(updated.activity_id),
        "venue_booking",
        Some(updated.id),
        "reject",
        format!(
            "user {} rejected venue booking {}",
            auth.0.username, updated.id
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(updated.into())
}

pub async fn cancel_booking(
    state: &AppState,
    auth: &AuthUser,
    booking_id: Uuid,
    req: ActionReasonRequest,
) -> Result<VenueBookingResponse, AppError> {
    let booking = sqlx::query_as::<_, VenueBooking>(
        "SELECT id,activity_id,venue_id,applicant_id,approver_id,start_time,end_time,status,reason,created_at,updated_at FROM venue_bookings WHERE id=$1",
    )
    .bind(booking_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("booking not found".to_string()))?;

    if auth.0.role != "admin" && booking.applicant_id != auth.0.id {
        return Err(AppError::Forbidden);
    }

    let updated = sqlx::query_as::<_, VenueBooking>(
        r#"UPDATE venue_bookings SET status='cancelled', reason=COALESCE($2, reason)
           WHERE id=$1 AND status IN ('pending','approved')
           RETURNING id,activity_id,venue_id,applicant_id,approver_id,start_time,end_time,status,reason,created_at,updated_at"#,
    )
    .bind(booking_id)
    .bind(req.reason)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::InvalidState("cannot cancel current booking state".to_string()))?;

    operation_log_service::try_log(
        state,
        Some(auth.0.id),
        Some(updated.activity_id),
        "venue_booking",
        Some(updated.id),
        "cancel",
        format!(
            "user {} cancelled venue booking {}",
            auth.0.username, updated.id
        ),
        serde_json::json!({}),
    )
    .await;

    Ok(updated.into())
}
