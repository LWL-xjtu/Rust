use chrono::Utc;
use uuid::Uuid;

use crate::{
    dto::device::{
        BorrowActionRequest, CreateDeviceBorrowRequest, CreateDeviceRequest, DeviceBorrowResponse,
        DeviceResponse, UpdateDeviceRequest,
    },
    errors::AppError,
    middleware::auth_extractor::AuthUser,
    models::device::{Device, DeviceBorrow},
    services::{activity_service, operation_log_service},
    state::AppState,
};

pub async fn list_devices(state: &AppState) -> Result<Vec<DeviceResponse>, AppError> {
    let rows = sqlx::query_as::<_, Device>(
        "SELECT id,name,category,serial_no,status,description,is_deleted,created_at,updated_at FROM devices WHERE is_deleted=FALSE ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await?;
    Ok(rows.into_iter().map(DeviceResponse::from).collect())
}

pub async fn create_device(
    state: &AppState,
    auth: &AuthUser,
    req: CreateDeviceRequest,
) -> Result<DeviceResponse, AppError> {
    operation_log_service::ensure_admin(&auth.0.role)?;

    let device = sqlx::query_as::<_, Device>(
        r#"INSERT INTO devices (id,name,category,serial_no,status,description)
           VALUES ($1,$2,$3,$4,$5,$6)
           RETURNING id,name,category,serial_no,status,description,is_deleted,created_at,updated_at"#,
    )
    .bind(Uuid::new_v4())
    .bind(req.name)
    .bind(req.category)
    .bind(req.serial_no)
    .bind(req.status.unwrap_or_else(|| "available".to_string()))
    .bind(req.description)
    .fetch_one(&state.db)
    .await?;
    Ok(device.into())
}

pub async fn get_device(state: &AppState, device_id: Uuid) -> Result<DeviceResponse, AppError> {
    let device = sqlx::query_as::<_, Device>(
        "SELECT id,name,category,serial_no,status,description,is_deleted,created_at,updated_at FROM devices WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(device_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("device not found".to_string()))?;
    Ok(device.into())
}

pub async fn update_device(
    state: &AppState,
    auth: &AuthUser,
    device_id: Uuid,
    req: UpdateDeviceRequest,
) -> Result<DeviceResponse, AppError> {
    operation_log_service::ensure_admin(&auth.0.role)?;

    let current = sqlx::query_as::<_, Device>(
        "SELECT id,name,category,serial_no,status,description,is_deleted,created_at,updated_at FROM devices WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(device_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("device not found".to_string()))?;

    let updated = sqlx::query_as::<_, Device>(
        r#"UPDATE devices SET name=$2,category=$3,status=$4,description=$5
           WHERE id=$1
           RETURNING id,name,category,serial_no,status,description,is_deleted,created_at,updated_at"#,
    )
    .bind(device_id)
    .bind(req.name.unwrap_or(current.name))
    .bind(req.category.unwrap_or(current.category))
    .bind(req.status.unwrap_or(current.status))
    .bind(req.description.or(current.description))
    .fetch_one(&state.db)
    .await?;
    Ok(updated.into())
}

pub async fn delete_device(
    state: &AppState,
    auth: &AuthUser,
    device_id: Uuid,
) -> Result<(), AppError> {
    operation_log_service::ensure_admin(&auth.0.role)?;

    let affected = sqlx::query(
        "UPDATE devices SET is_deleted=TRUE, status='disabled' WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(device_id)
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("device not found".to_string()));
    }
    Ok(())
}

pub async fn create_borrow(
    state: &AppState,
    auth: &AuthUser,
    req: CreateDeviceBorrowRequest,
) -> Result<DeviceBorrowResponse, AppError> {
    activity_service::ensure_activity_read_access(state, auth, req.activity_id).await?;

    let device = sqlx::query_as::<_, Device>(
        "SELECT id,name,category,serial_no,status,description,is_deleted,created_at,updated_at FROM devices WHERE id=$1 AND is_deleted=FALSE",
    )
    .bind(req.device_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("device not found".to_string()))?;

    if device.status == "maintenance" || device.status == "disabled" {
        return Err(AppError::InvalidState(
            "device is not available for borrowing".to_string(),
        ));
    }

    if device.status == "borrowed" {
        return Err(AppError::InvalidState(
            "device already borrowed".to_string(),
        ));
    }

    let mut tx = state.db.begin().await?;

    let borrow = sqlx::query_as::<_, DeviceBorrow>(
        r#"INSERT INTO device_borrows (id,activity_id,device_id,borrower_id,expected_return_time,status,remark)
           VALUES ($1,$2,$3,$4,$5,'pending',$6)
           RETURNING id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at"#,
    )
    .bind(Uuid::new_v4())
    .bind(req.activity_id)
    .bind(req.device_id)
    .bind(auth.0.id)
    .bind(req.expected_return_time)
    .bind(req.remark)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query("UPDATE devices SET status='pending' WHERE id=$1")
        .bind(req.device_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(borrow.into())
}

pub async fn list_borrows(
    state: &AppState,
    auth: &AuthUser,
) -> Result<Vec<DeviceBorrowResponse>, AppError> {
    let rows = if auth.0.role == "admin" {
        sqlx::query_as::<_, DeviceBorrow>(
            "SELECT id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at FROM device_borrows ORDER BY created_at DESC",
        )
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, DeviceBorrow>(
            "SELECT id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at FROM device_borrows WHERE borrower_id=$1 ORDER BY created_at DESC",
        )
        .bind(auth.0.id)
        .fetch_all(&state.db)
        .await?
    };

    Ok(rows.into_iter().map(DeviceBorrowResponse::from).collect())
}

pub async fn get_borrow(
    state: &AppState,
    auth: &AuthUser,
    borrow_id: Uuid,
) -> Result<DeviceBorrowResponse, AppError> {
    let borrow = sqlx::query_as::<_, DeviceBorrow>(
        "SELECT id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at FROM device_borrows WHERE id=$1",
    )
    .bind(borrow_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("borrow record not found".to_string()))?;

    if auth.0.role != "admin" && borrow.borrower_id != auth.0.id {
        return Err(AppError::Forbidden);
    }

    Ok(borrow.into())
}

pub async fn approve_borrow(
    state: &AppState,
    auth: &AuthUser,
    borrow_id: Uuid,
) -> Result<DeviceBorrowResponse, AppError> {
    operation_log_service::ensure_admin(&auth.0.role)?;

    let mut tx = state.db.begin().await?;

    let borrow = sqlx::query_as::<_, DeviceBorrow>(
        "SELECT id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at FROM device_borrows WHERE id=$1",
    )
    .bind(borrow_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("borrow record not found".to_string()))?;

    if borrow.status != "pending" {
        return Err(AppError::InvalidState(
            "only pending record can be approved".to_string(),
        ));
    }

    let updated = sqlx::query_as::<_, DeviceBorrow>(
        r#"UPDATE device_borrows SET status='approved', approver_id=$2 WHERE id=$1
           RETURNING id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at"#,
    )
    .bind(borrow_id)
    .bind(auth.0.id)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(updated.into())
}

pub async fn reject_borrow(
    state: &AppState,
    auth: &AuthUser,
    borrow_id: Uuid,
    req: BorrowActionRequest,
) -> Result<DeviceBorrowResponse, AppError> {
    operation_log_service::ensure_admin(&auth.0.role)?;

    let mut tx = state.db.begin().await?;

    let borrow = sqlx::query_as::<_, DeviceBorrow>(
        "SELECT id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at FROM device_borrows WHERE id=$1",
    )
    .bind(borrow_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("borrow record not found".to_string()))?;

    if borrow.status != "pending" {
        return Err(AppError::InvalidState(
            "only pending record can be rejected".to_string(),
        ));
    }

    let updated = sqlx::query_as::<_, DeviceBorrow>(
        r#"UPDATE device_borrows SET status='rejected', approver_id=$2, remark=COALESCE($3,remark) WHERE id=$1
           RETURNING id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at"#,
    )
    .bind(borrow_id)
    .bind(auth.0.id)
    .bind(req.remark)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query("UPDATE devices SET status='available' WHERE id=$1")
        .bind(updated.device_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(updated.into())
}

pub async fn checkout_borrow(
    state: &AppState,
    auth: &AuthUser,
    borrow_id: Uuid,
) -> Result<DeviceBorrowResponse, AppError> {
    operation_log_service::ensure_admin(&auth.0.role)?;

    let mut tx = state.db.begin().await?;

    let borrow = sqlx::query_as::<_, DeviceBorrow>(
        "SELECT id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at FROM device_borrows WHERE id=$1",
    )
    .bind(borrow_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("borrow record not found".to_string()))?;

    if borrow.status != "approved" {
        return Err(AppError::InvalidState(
            "borrow record must be approved first".to_string(),
        ));
    }

    let updated = sqlx::query_as::<_, DeviceBorrow>(
        r#"UPDATE device_borrows SET status='borrowed', borrow_time=$2 WHERE id=$1
           RETURNING id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at"#,
    )
    .bind(borrow_id)
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query("UPDATE devices SET status='borrowed' WHERE id=$1")
        .bind(updated.device_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(updated.into())
}

pub async fn return_borrow(
    state: &AppState,
    auth: &AuthUser,
    borrow_id: Uuid,
) -> Result<DeviceBorrowResponse, AppError> {
    operation_log_service::ensure_admin(&auth.0.role)?;

    let mut tx = state.db.begin().await?;

    let borrow = sqlx::query_as::<_, DeviceBorrow>(
        "SELECT id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at FROM device_borrows WHERE id=$1",
    )
    .bind(borrow_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("borrow record not found".to_string()))?;

    if borrow.status != "borrowed" {
        return Err(AppError::InvalidState(
            "only borrowed record can be returned".to_string(),
        ));
    }

    let updated = sqlx::query_as::<_, DeviceBorrow>(
        r#"UPDATE device_borrows SET status='returned', actual_return_time=$2 WHERE id=$1
           RETURNING id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at"#,
    )
    .bind(borrow_id)
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query("UPDATE devices SET status='available' WHERE id=$1")
        .bind(updated.device_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(updated.into())
}

pub async fn cancel_borrow(
    state: &AppState,
    auth: &AuthUser,
    borrow_id: Uuid,
    req: BorrowActionRequest,
) -> Result<DeviceBorrowResponse, AppError> {
    let mut tx = state.db.begin().await?;

    let borrow = sqlx::query_as::<_, DeviceBorrow>(
        "SELECT id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at FROM device_borrows WHERE id=$1",
    )
    .bind(borrow_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("borrow record not found".to_string()))?;

    if auth.0.role != "admin" && borrow.borrower_id != auth.0.id {
        return Err(AppError::Forbidden);
    }

    if !["pending", "approved"].contains(&borrow.status.as_str()) {
        return Err(AppError::InvalidState(
            "cannot cancel current borrow state".to_string(),
        ));
    }

    let updated = sqlx::query_as::<_, DeviceBorrow>(
        r#"UPDATE device_borrows SET status='cancelled', remark=COALESCE($2,remark) WHERE id=$1
           RETURNING id,activity_id,device_id,borrower_id,approver_id,borrow_time,expected_return_time,actual_return_time,status,remark,created_at,updated_at"#,
    )
    .bind(borrow_id)
    .bind(req.remark)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query("UPDATE devices SET status='available' WHERE id=$1")
        .bind(updated.device_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(updated.into())
}
