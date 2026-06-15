# Campus Collaboration Full-Flow System

后端：Rust + Axum + SQLx + PostgreSQL  
前端：Vite + React + TypeScript

## 已完成功能
- 用户注册/登录、JWT 鉴权、角色（admin/teacher/student）
- 活动管理（增删改查）
- 成员管理（添加/移除/列表、防重复）
- 场地预约（申请、审批、拒绝、取消）
- 设备借用（申请、审批、拒绝、借出、归还、取消）
- 任务管理（创建、查询、详情、修改、删除、状态流转）
- 任务进度记录（时间线、状态变更留痕）
- 操作日志（全局/按活动查询）
- 统计概览与活动统计
- **OpenAPI/Swagger 接口文档（utoipa 自动生成）**

## 接口文档（OpenAPI / Swagger UI）

后端使用 `utoipa` 以 code-first 方式从各接口与 DTO 注解自动生成 OpenAPI 3.0 规范，覆盖全部 50+ 接口，含统一响应结构、JWT Bearer 安全方案与按模块分组的 tag。

服务启动后访问：
- Swagger UI 可视化交互文档：`http://127.0.0.1:8080/swagger-ui`
- OpenAPI 规范 JSON：`http://127.0.0.1:8080/api-docs/openapi.json`

> 在 Swagger UI 右上角 `Authorize` 中填入登录接口返回的 JWT 令牌，即可直接调试受保护接口。

## 本次新增与完善（Week 5-7 强化）
- 成员管理权限收敛：活动负责人/教师/管理员可管理成员
- 任务状态统一为：`pending/in_progress/completed/delayed/cancelled`
- 任务状态变更自动写入进度日志
- 进度日志字段统一为 `content + old_status + new_status`
- 操作日志增强：`actor_id/activity_id/metadata(JSONB)`
- 活动日志查询按 `activity_id` 精确过滤
- 场地预约、设备借用关键动作补齐日志记录
- 前端任务页/活动详情页/全局样式升级，更接近产品化界面

## 本地运行

### 1. 后端
1. 复制环境变量：`Copy-Item .env.example .env`
2. 配置 `.env`（至少：`DATABASE_URL`、`JWT_SECRET`）
3. 启动：`cargo run`
4. 质量检查：
   - `cargo fmt`
   - `cargo check`
   - `cargo test`

> 启动时自动执行 `migrations/`。

### 2. 前端
1. `cd frontend`
2. `npm install`
3. 配置前端环境变量 `frontend/.env`：
   - `VITE_API_BASE_URL=http://127.0.0.1:8080`
4. 启动开发：`npm run dev`
5. 构建：`npm run build`

> 本仓库 `frontend/package.json` 当前未定义 `lint` 脚本。

## 数据库迁移说明
- `20260411195800_create_users.sql`
- `20260429110000_week5_7_core_modules.sql`
- `20260518090000_harden_tasks_members_logs.sql`（本次新增）
  - 统一任务状态约束
  - `task_progress_logs` 增加 `activity_id`，并改名 `user_id/content`
  - `operation_logs` 增加 `actor_id/activity_id/metadata`
  - 增加常用索引（activity_id/task_id/actor_id/created_at 等）

## 部署步骤（推荐 Render + Vercel）

### 后端（Render）
1. 在 Render 创建 PostgreSQL（或使用 Neon/Supabase/Railway PG）
2. 在 Render 新建 Web Service，连接本仓库，使用 `Dockerfile`
3. 环境变量配置：
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `RUST_LOG`
   - `APP_HOST=0.0.0.0`
   - `APP_PORT=8080`
   - `DATABASE_MAX_CONNECTIONS=10`
   - `FRONTEND_ORIGIN=https://你的前端域名`
4. 部署后在日志确认：
   - Postgres 连接成功
   - migration 自动执行成功
   - 服务监听 `0.0.0.0:8080`
5. 用 `GET /api/health` 验证服务可访问

### 前端（Vercel/Netlify）
1. 导入同一仓库，Root 设为 `frontend`
2. 构建命令：`npm run build`，输出目录：`dist`
3. 设置环境变量：
   - `VITE_API_BASE_URL=https://你的后端公网地址`
4. 部署后验证登录、活动、任务、日志页面

### docs / GitHub Pages 门户
- 更新 `docs/index.html` 中“进入系统”按钮链接为真实前端地址。

## 演示账号
- `admin_demo / 123456`
- `teacher_demo / 123456`
- `student_demo / 123456`

## 主流程验收步骤
1. 注册 / 登录  
2. 创建活动  
3. 添加成员  
4. 创建场地预约  
5. 审批预约  
6. 创建设备  
7. 申请设备借用  
8. 审批并借出  
9. 归还设备  
10. 创建任务  
11. 指派任务  
12. 更新任务状态  
13. 添加进度记录  
14. 查看活动操作日志  
15. 查看统计数据  
16. 打开前端公网地址演示全流程
