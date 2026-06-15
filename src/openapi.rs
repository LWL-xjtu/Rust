use utoipa::{
    openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
    Modify, OpenApi,
};

use crate::{dto, handlers};

/// 向 OpenAPI 文档注入 JWT Bearer 安全方案。
struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi
            .components
            .get_or_insert_with(utoipa::openapi::Components::default);
        components.add_security_scheme(
            "bearer_auth",
            SecurityScheme::Http(
                HttpBuilder::new()
                    .scheme(HttpAuthScheme::Bearer)
                    .bearer_format("JWT")
                    .description(Some(
                        "登录接口返回的 JWT 令牌，使用方式：Authorization: Bearer <token>",
                    ))
                    .build(),
            ),
        );
    }
}

/// 校园协作活动全流程管理系统 —— OpenAPI 文档聚合。
///
/// 采用 utoipa 以 code-first 方式从处理函数与 DTO 注解生成 OpenAPI 3.0 规范，
/// 通过 `/api-docs/openapi.json` 暴露，并由 `/swagger-ui` 提供可视化交互界面。
#[derive(OpenApi)]
#[openapi(
    info(
        title = "校园协作活动全流程管理系统 API",
        version = "0.1.0",
        description = "基于 Rust（Axum + Tokio + SQLx + PostgreSQL）实现的校园协作活动全流程管理系统后端接口文档。\n\n所有业务接口统一返回 `{ code, message, data }` 结构，`code = 0` 表示成功。受保护接口需在请求头携带 `Authorization: Bearer <token>`。",
        contact(name = "Campus Collab Backend")
    ),
    servers(
        (url = "/", description = "当前服务")
    ),
    paths(
        // 系统
        handlers::health_handler::health,
        handlers::health_handler::live,
        handlers::health_handler::ready,
        // 认证
        handlers::auth_handler::register,
        handlers::auth_handler::login,
        // 用户
        handlers::user_handler::me,
        handlers::user_handler::list_users,
        // 活动
        handlers::activity_handler::create,
        handlers::activity_handler::list,
        handlers::activity_handler::get,
        handlers::activity_handler::update,
        handlers::activity_handler::delete,
        handlers::activity_handler::list_members,
        handlers::activity_handler::add_member,
        handlers::activity_handler::remove_member,
        // 场地预约
        handlers::venue_handler::list_venues,
        handlers::venue_handler::create_venue,
        handlers::venue_handler::update_venue,
        handlers::venue_handler::delete_venue,
        handlers::venue_handler::create_booking,
        handlers::venue_handler::list_bookings,
        handlers::venue_handler::get_booking,
        handlers::venue_handler::approve_booking,
        handlers::venue_handler::reject_booking,
        handlers::venue_handler::cancel_booking,
        // 设备借用
        handlers::device_handler::list_devices,
        handlers::device_handler::create_device,
        handlers::device_handler::get_device,
        handlers::device_handler::update_device,
        handlers::device_handler::delete_device,
        handlers::device_handler::create_borrow,
        handlers::device_handler::list_borrows,
        handlers::device_handler::get_borrow,
        handlers::device_handler::approve_borrow,
        handlers::device_handler::reject_borrow,
        handlers::device_handler::checkout_borrow,
        handlers::device_handler::return_borrow,
        handlers::device_handler::cancel_borrow,
        // 任务分工
        handlers::task_handler::create_task,
        handlers::task_handler::list_tasks,
        handlers::task_handler::get_task,
        handlers::task_handler::update_task,
        handlers::task_handler::delete_task,
        handlers::task_handler::update_task_status,
        handlers::task_handler::add_task_progress_log,
        handlers::task_handler::get_task_progress_logs,
        handlers::task_handler::list_activity_tasks,
        // 日志留痕
        handlers::operation_log_handler::list_logs,
        handlers::operation_log_handler::list_activity_logs,
        // 统计分析
        handlers::stats_handler::overview,
        handlers::stats_handler::activity_stats,
        handlers::stats_handler::college_stats,
        // 管理员
        handlers::admin_handler::list_users,
        handlers::admin_handler::update_user_role,
        handlers::admin_handler::update_user_status,
        handlers::admin_handler::update_user_college,
    ),
    components(schemas(
        dto::common::EmptyData,
        dto::auth::RegisterRequest,
        dto::auth::LoginRequest,
        dto::auth::LoginResponse,
        dto::user::UserResponse,
        dto::activity::CreateActivityRequest,
        dto::activity::UpdateActivityRequest,
        dto::activity::AddActivityMemberRequest,
        dto::activity::ActivityResponse,
        dto::activity::ActivityMemberResponse,
        dto::venue::CreateVenueRequest,
        dto::venue::UpdateVenueRequest,
        dto::venue::CreateVenueBookingRequest,
        dto::venue::ActionReasonRequest,
        dto::venue::VenueResponse,
        dto::venue::VenueBookingResponse,
        dto::device::CreateDeviceRequest,
        dto::device::UpdateDeviceRequest,
        dto::device::CreateDeviceBorrowRequest,
        dto::device::BorrowActionRequest,
        dto::device::DeviceResponse,
        dto::device::DeviceBorrowResponse,
        dto::task::CreateTaskRequest,
        dto::task::UpdateTaskRequest,
        dto::task::UpdateTaskStatusRequest,
        dto::task::AddTaskProgressLogRequest,
        dto::task::TaskResponse,
        dto::task::TaskProgressLogResponse,
        dto::operation_log::OperationLogResponse,
        dto::stats::OverviewStatsResponse,
        dto::stats::ActivityStatsResponse,
        dto::stats::UserCollegeStatsResponse,
        dto::stats::ActivityCollegeStatsResponse,
        dto::stats::CollegeStatsResponse,
        dto::admin::UpdateUserRoleRequest,
        dto::admin::UpdateUserStatusRequest,
        dto::admin::UpdateUserCollegeRequest,
        handlers::health_handler::HealthPayload,
        handlers::health_handler::ReadyPayload,
    )),
    modifiers(&SecurityAddon),
    tags(
        (name = "系统", description = "健康检查与探活"),
        (name = "认证", description = "注册、登录与令牌签发"),
        (name = "用户", description = "当前用户信息与用户列表"),
        (name = "活动", description = "协作活动创建与成员管理"),
        (name = "场地预约", description = "场地管理与预约审批，含时间冲突检测"),
        (name = "设备借用", description = "设备管理与借用归还流程"),
        (name = "任务分工", description = "任务分配、状态流转与进度留痕"),
        (name = "日志留痕", description = "关键操作日志查询"),
        (name = "统计分析", description = "总览、活动与学院维度统计"),
        (name = "管理员", description = "用户角色、状态与学院管理")
    )
)]
pub struct ApiDoc;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn openapi_spec_generates_and_serializes() {
        let doc = ApiDoc::openapi();
        let json = doc.to_json().expect("OpenAPI 文档应能序列化为 JSON");

        // 关键接口路径应存在
        for path in [
            "/api/auth/login",
            "/api/activities",
            "/api/venue-bookings",
            "/api/device-borrows",
            "/api/tasks",
            "/api/operation-logs",
            "/api/stats/overview",
            "/api/admin/users",
        ] {
            assert!(doc.paths.paths.contains_key(path), "缺少接口路径: {path}");
        }

        // 安全方案应已注入
        let components = doc.components.as_ref().expect("应包含 components");
        assert!(
            components.security_schemes.contains_key("bearer_auth"),
            "应注入 bearer_auth 安全方案"
        );

        // 核心 DTO schema 应已注册
        for schema in ["UserResponse", "ActivityResponse", "VenueBookingResponse"] {
            assert!(
                components.schemas.contains_key(schema),
                "缺少 schema: {schema}"
            );
        }

        assert!(json.contains("校园协作活动全流程管理系统"));
    }
}
