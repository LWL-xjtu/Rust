use serde::Serialize;
use utoipa::ToSchema;

/// 统一响应包装结构。所有接口都以该结构返回，`code` 为 0 表示成功，
/// 非 0 表示业务错误码（详见错误码说明）。
#[derive(Debug, Serialize, ToSchema)]
#[aliases(
    ApiResponseEmpty = ApiResponse<EmptyData>,
    ApiResponseString = ApiResponse<String>
)]
pub struct ApiResponse<T>
where
    T: Serialize,
{
    /// 业务状态码，0 表示成功
    pub code: i32,
    /// 提示信息
    pub message: String,
    /// 业务数据，错误时为 null
    pub data: Option<T>,
}

impl<T> ApiResponse<T>
where
    T: Serialize,
{
    pub fn success(data: T) -> Self {
        Self {
            code: 0,
            message: "success".to_string(),
            data: Some(data),
        }
    }
}

impl ApiResponse<()> {
    pub fn error(code: i32, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            data: None,
        }
    }
}

/// 无业务数据返回时的占位类型（例如删除、移除成员等操作）。
#[derive(Debug, Serialize, ToSchema)]
pub struct EmptyData {}
