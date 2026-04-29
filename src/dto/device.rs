use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::device::{Device, DeviceBorrow};

#[derive(Debug, Deserialize)]
pub struct CreateDeviceRequest {
    pub name: String,
    pub category: String,
    pub serial_no: String,
    pub status: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDeviceRequest {
    pub name: Option<String>,
    pub category: Option<String>,
    pub status: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDeviceBorrowRequest {
    pub activity_id: Uuid,
    pub device_id: Uuid,
    pub expected_return_time: DateTime<Utc>,
    pub remark: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BorrowActionRequest {
    pub remark: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DeviceResponse {
    pub id: Uuid,
    pub name: String,
    pub category: String,
    pub serial_no: String,
    pub status: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DeviceBorrowResponse {
    pub id: Uuid,
    pub activity_id: Uuid,
    pub device_id: Uuid,
    pub borrower_id: Uuid,
    pub approver_id: Option<Uuid>,
    pub borrow_time: Option<DateTime<Utc>>,
    pub expected_return_time: DateTime<Utc>,
    pub actual_return_time: Option<DateTime<Utc>>,
    pub status: String,
    pub remark: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<Device> for DeviceResponse {
    fn from(d: Device) -> Self {
        Self {
            id: d.id,
            name: d.name,
            category: d.category,
            serial_no: d.serial_no,
            status: d.status,
            description: d.description,
        }
    }
}

impl From<DeviceBorrow> for DeviceBorrowResponse {
    fn from(b: DeviceBorrow) -> Self {
        Self {
            id: b.id,
            activity_id: b.activity_id,
            device_id: b.device_id,
            borrower_id: b.borrower_id,
            approver_id: b.approver_id,
            borrow_time: b.borrow_time,
            expected_return_time: b.expected_return_time,
            actual_return_time: b.actual_return_time,
            status: b.status,
            remark: b.remark,
            created_at: b.created_at,
        }
    }
}
