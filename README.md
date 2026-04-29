# 基于 Rust 的校园协作活动全流程管理系统后端

本项目是课程设计《基于 Rust 的校园协作活动全流程管理系统后端设计与实现》的后端实现。

当前进度：**第 3-4 周基础能力完成，第 5/6/7 周核心业务模块已接入**，并提供 GitHub Pages 项目展示页。

## 1. 技术栈

- Rust
- Axum
- Tokio
- SQLx
- PostgreSQL
- Serde
- dotenvy
- tracing / tracing-subscriber
- jsonwebtoken
- argon2
- uuid
- chrono
- thiserror

## 2. 当前已完成模块

### Week 3-4

- 项目初始化与分层目录结构
- PostgreSQL 连接池与 SQLx migration
- 统一响应 `ApiResponse<T>`
- 统一错误 `AppError`
- 用户注册、登录、JWT 签发
- Bearer Token 鉴权提取器
- 当前用户接口 `/api/users/me`
- 健康检查 `/health`、`/health/live`、`/health/ready`

### Week 5

- 协作活动管理：创建、列表、详情、修改、软删除
- 活动成员管理：添加成员、移除成员
- 场地管理：创建、更新、删除、列表
- 场地预约：申请、列表、详情、审批通过、驳回、取消
- 场地冲突检测：同场地已批准时段不可重叠

### Week 6

- 设备管理：创建、列表、详情、更新、删除
- 设备借用：申请、列表、详情、审批、驳回、借出、归还、取消
- 借用状态流转与设备状态联动
- 关键流程事务化（审批/借出/归还）

### Week 7

- 任务管理：创建、列表、详情、修改、删除
- 任务状态更新接口
- 任务进度日志（状态变更与手动说明）
- 操作日志查询
- 统计接口（系统总览 / 活动维度）

## 3. 目录结构

```text
src/
  config/
  routes/
  handlers/
  services/
  models/
  dto/
  middleware/
  utils/
  errors/
  state.rs
  main.rs
migrations/
docs/                    # GitHub Pages 页面
integration_from_5_repos/
vendor/
```

## 4. 环境变量

参考 `.env.example`：

```env
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/campus_collab
JWT_SECRET=change_me_to_a_strong_secret
JWT_EXPIRES_IN_HOURS=24
RUST_LOG=info,campus_collab_backend=debug,sqlx=warn
APP_HOST=127.0.0.1
APP_PORT=8080
DATABASE_MAX_CONNECTIONS=10
```

## 5. 数据库 migration

项目启动时会自动执行迁移：

- `migrations/20260411195800_create_users.sql`
- `migrations/20260429110000_week5_7_core_modules.sql`

可手动执行：

```bash
sqlx database create
sqlx migrate run
```

## 6. 本地启动（详细步骤）

1. 准备 PostgreSQL 数据库并创建数据库（如 `campus_collab`）
2. 复制环境变量文件

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. 修改 `.env` 中 `DATABASE_URL`、`JWT_SECRET`
4. 启动服务

```bash
cargo run
```

默认地址：`http://127.0.0.1:8080`

5. 健康检查

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/health/live
curl http://127.0.0.1:8080/health/ready
```

## 7. API 简要列表

### Auth / User

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

### Activities

- `POST /api/activities`
- `GET /api/activities`
- `GET /api/activities/{id}`
- `PUT /api/activities/{id}`
- `DELETE /api/activities/{id}`
- `POST /api/activities/{id}/members`
- `DELETE /api/activities/{id}/members/{user_id}`

### Venues / Venue Bookings

- `GET /api/venues`
- `POST /api/venues`
- `PUT /api/venues/{id}`
- `DELETE /api/venues/{id}`
- `POST /api/venue-bookings`
- `GET /api/venue-bookings`
- `GET /api/venue-bookings/{id}`
- `POST /api/venue-bookings/{id}/approve`
- `POST /api/venue-bookings/{id}/reject`
- `POST /api/venue-bookings/{id}/cancel`

### Devices / Device Borrows

- `GET /api/devices`
- `POST /api/devices`
- `GET /api/devices/{id}`
- `PUT /api/devices/{id}`
- `DELETE /api/devices/{id}`
- `POST /api/device-borrows`
- `GET /api/device-borrows`
- `GET /api/device-borrows/{id}`
- `POST /api/device-borrows/{id}/approve`
- `POST /api/device-borrows/{id}/reject`
- `POST /api/device-borrows/{id}/checkout`
- `POST /api/device-borrows/{id}/return`
- `POST /api/device-borrows/{id}/cancel`

### Tasks / Progress

- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
- `POST /api/tasks/{id}/status`
- `POST /api/tasks/{id}/progress-logs`
- `GET /api/tasks/{id}/progress-logs`
- `GET /api/activities/{id}/tasks`

### Logs / Stats

- `GET /api/operation-logs`
- `GET /api/activities/{id}/operation-logs`
- `GET /api/stats/overview`
- `GET /api/stats/activities/{id}`

## 8. 主流程演示（建议顺序）

1. 注册：`POST /api/auth/register`
2. 登录：`POST /api/auth/login`（拿 token）
3. 创建活动：`POST /api/activities`
4. 添加成员：`POST /api/activities/{id}/members`
5. 创建场地预约：`POST /api/venue-bookings`
6. 审批预约：`POST /api/venue-bookings/{id}/approve`
7. 创建设备借用：`POST /api/device-borrows`
8. 审批并借出/归还：`approve -> checkout -> return`
9. 创建任务：`POST /api/tasks`
10. 更新任务状态：`POST /api/tasks/{id}/status`
11. 查询统计与日志：`/api/stats/*`、`/api/operation-logs`
12. 打开 GitHub Pages 页面展示模块与进度

## 9. GitHub Pages

页面文件位置：

- `docs/index.html`
- `docs/style.css`
- `docs/app.js`

页面内容：

- 项目首页与技术栈
- 功能模块卡片
- 第 1-7 周时间线
- API 模块筛选展示
- 分层架构展示
- 本地演示说明

## 10. 后续计划（Week 8+）

- 完善细粒度 RBAC
- 增加集成测试与测试数据隔离
- 接入 OpenAPI 自动文档
- 完善部署与运维脚本
