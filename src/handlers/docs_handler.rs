use axum::{response::Html, Json};
use utoipa::OpenApi;

use crate::openapi::ApiDoc;

/// 返回 OpenAPI 3.0 规范 JSON。
///
/// 由 utoipa 在编译期根据各接口与 DTO 上的注解生成，供 Swagger UI、
/// 前端代码生成器或 API 测试工具消费。
#[utoipa::path(
    get,
    path = "/api-docs/openapi.json",
    tag = "系统",
    responses((status = 200, description = "OpenAPI 规范文档"))
)]
pub async fn openapi_json() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

/// 返回 Swagger UI 交互式文档页面。
///
/// 通过 CDN 加载 Swagger UI 静态资源并指向本服务的 `/api-docs/openapi.json`，
/// 避免编译期下载依赖，保证离线构建可用。
pub async fn swagger_ui() -> Html<&'static str> {
    Html(SWAGGER_UI_HTML)
}

const SWAGGER_UI_HTML: &str = r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>校园协作活动全流程管理系统 - API 文档</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body { margin: 0; background: #fafafa; }
        .topbar { display: none; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function () {
            window.ui = SwaggerUIBundle({
                url: '/api-docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                persistAuthorization: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: 'StandaloneLayout'
            });
        };
    </script>
</body>
</html>"#;
