use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::venue::{Venue, VenueBooking};

#[derive(Debug, Deserialize)]
pub struct CreateVenueRequest {
    pub name: String,
    pub location: String,
    pub capacity: i32,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateVenueRequest {
    pub name: Option<String>,
    pub location: Option<String>,
    pub capacity: Option<i32>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateVenueBookingRequest {
    pub activity_id: Uuid,
    pub venue_id: Uuid,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ActionReasonRequest {
    pub reason: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct VenueResponse {
    pub id: Uuid,
    pub name: String,
    pub location: String,
    pub capacity: i32,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct VenueBookingResponse {
    pub id: Uuid,
    pub activity_id: Uuid,
    pub venue_id: Uuid,
    pub applicant_id: Uuid,
    pub approver_id: Option<Uuid>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub status: String,
    pub reason: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<Venue> for VenueResponse {
    fn from(v: Venue) -> Self {
        Self {
            id: v.id,
            name: v.name,
            location: v.location,
            capacity: v.capacity,
            status: v.status,
        }
    }
}

impl From<VenueBooking> for VenueBookingResponse {
    fn from(v: VenueBooking) -> Self {
        Self {
            id: v.id,
            activity_id: v.activity_id,
            venue_id: v.venue_id,
            applicant_id: v.applicant_id,
            approver_id: v.approver_id,
            start_time: v.start_time,
            end_time: v.end_time,
            status: v.status,
            reason: v.reason,
            created_at: v.created_at,
        }
    }
}
