use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct UpdateUserRoleRequest {
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserStatusRequest {
    pub is_active: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserCollegeRequest {
    pub college: Option<String>,
}
