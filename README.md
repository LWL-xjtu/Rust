# 校园协作活动全流程管理系统

> Campus Collaboration Full-Flow Management System
>
> 一个面向高校社团 / 课程团队的协作管理平台，覆盖活动、成员、场地、设备、任务、日志、统计的完整业务闭环。

后端：**Rust + Axum + SQLx + PostgreSQL**
前端：**Vite + React + TypeScript**
接口文档：**utoipa 自动生成 OpenAPI 3.0 / Swagger UI**

---

## 目录

- [功能概览](#功能概览)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [API 与接口文档](#api-与接口文档)
- [数据库迁移](#数据库迁移)
- [部署](#部署)
- [演示账号](#演示账号)
- [主流程验收](#主流程验收)

---

## 功能概览

| 模块 | 能力 |
| --- | --- |
| 认证与权限 | 注册 / 登录、JWT 鉴权、角色三级（admin / teacher / student） |
| 用户管理 | 个人资料、管理员维护用户角色 / 状态 / 学院 |
| 活动管理 | 活动增删改查、成员添加 / 移除 / 列表（防重复） |
| 场地预约 | 申请、审批、拒绝、取消 |
| 设备借用 | 申请、审批、拒绝、借出、归还、取消 |
| 任务管理 | 创建、查询、详情、修改、删除、状态流转 |
| 进度留痕 | 任务进度时间线，状态变更自动写入日志 |
| 操作日志 | 全局 / 按活动查询，含操作者、活动、元数据（JSONB） |
| 统计分析 | 概览统计、单活动统计、按学院统计 |

任务状态统一为：`pending` / `in_progress` / `completed` / `delayed` / `cancelled`。

---

## 技术栈

**后端**

- `axum 0.7` —— Web 框架与路由
- `tokio 1.44` —— 异步运行时
- `sqlx 0.8`（PostgreSQL）—— 编译期校验的数据库访问 + 启动自动迁移
- `jsonwebtoken 9` + `argon2 0.5` —— JWT 签发与密码哈希
- `utoipa 4.2` —— code-first 生成 OpenAPI / Swagger UI
- `tower-http` —— CORS 与请求追踪
- `tracing` —— 结构化日志

**前端**

- `react 18` + `react-router-dom 6`
- `vite 5` + `typescript 5`
- 原生 `fetch` 封装的轻量 API 客户端（`src/api/client.ts`）

---

## 目录结构

```text
Rust/
├── src/                          # 后端源码（Rust）
│   ├── main.rs                   # 入口：加载配置、连接 DB、跑迁移、启动服务
│   ├── state.rs                  # 全局 AppState（连接池 + JWT 配置）
│   ├── openapi.rs                # OpenAPI 文档聚合定义
│   ├── config/                   # 环境变量解析
│   ├── routes/                   # 路由注册（按模块拆分）
│   ├── handlers/                 # HTTP 处理器（请求 → 服务）
│   ├── services/                 # 业务逻辑层
│   ├── models/                   # 数据库实体模型
│   ├── dto/                      # 请求 / 响应数据结构
│   ├── middleware/               # 鉴权提取器等中间件
│   ├── errors/                   # 统一错误类型与响应
│   └── utils/                    # JWT、密码哈希等工具
├── migrations/                   # SQLx 数据库迁移（按时间戳顺序执行）
├── frontend/                     # 前端源码（Vite + React + TS）
│   ├── src/
│   │   ├── api/                  # 各模块 API 调用 + 客户端封装
│   │   ├── components/           # 通用组件（布局、导航、路由守卫等）
│   │   ├── pages/                # 业务页面（登录 / 活动 / 任务 / 日志 …）
│   │   ├── styles/               # 全局与模块样式
│   │   └── utils/                # 展示辅助函数
│   └── vite.config.ts
├── docs/                         # GitHub Pages 项目门户（静态页）
├── Dockerfile                    # 后端容器构建
├── render.yaml                   # Render 部署配置
├── .env.example                  # 后端环境变量样例
├── Cargo.toml                    # Rust 依赖清单
├── integration_from_5_repos/     # 5 个参考仓库的整合说明与溯源材料
└── vendor/                       # 参考来源仓库快照（仅供溯源，不参与构建）
```

> `vendor/` 与 `integration_from_5_repos/` 为课程作业的来源追溯材料：记录本项目从 5 个开源 Axum 项目中吸收的设计（CORS 中间件、`/health/live`、`/health/ready` 等），不参与后端编译与部署。

---

## 快速开始

> 服务默认端口为 **7897**。

### 1. 后端

```bash
# 1) 准备环境变量
cp .env.example .env
# 编辑 .env，至少配置 DATABASE_URL 与 JWT_SECRET

# 2) 启动（首次启动自动执行 migrations/）
cargo run

# 3) 质量检查
cargo fmt
cargo check
cargo test
```

启动成功后服务监听 `http://127.0.0.1:7897`。

### 2. 前端

```bash
cd frontend

# 1) 安装依赖
npm install

# 2) 配置前端环境变量
cp .env.example .env
# 默认 VITE_API_BASE_URL=http://127.0.0.1:7897

# 3) 启动开发服务器（Vite 默认 5173）
npm run dev

# 4) 生产构建
npm run build
```

> `frontend/package.json` 暂未定义 `lint` 脚本。

---

## 环境变量

后端（`.env`）：

| 变量 | 说明 | 默认 / 示例 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串（必填） | `postgres://postgres:postgres@127.0.0.1:5432/campus_collab` |
| `JWT_SECRET` | JWT 签名密钥（必填，请改强密钥） | `change_me_to_a_strong_secret` |
| `JWT_EXPIRES_IN_HOURS` | 令牌有效期（小时） | `24` |
| `APP_HOST` | 监听地址 | `127.0.0.1` |
| `APP_PORT` | 监听端口 | `7897` |
| `DATABASE_MAX_CONNECTIONS` | 连接池上限 | `10` |
| `FRONTEND_ORIGIN` | CORS 允许的前端来源 | `http://127.0.0.1:5173` |
| `RUST_LOG` | 日志级别 | `info,campus_collab_backend=debug,sqlx=warn` |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 首启自动创建的管理员（可选） | 留空则跳过 |

前端（`frontend/.env`）：

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://127.0.0.1:7897` |
| `VITE_PRODUCT_URL` | 门户「进入系统」跳转地址 | 部署后替换 |

---

## API 与接口文档

后端以 code-first 方式自动生成 OpenAPI 3.0 规范，覆盖全部 50+ 接口，含统一响应结构、JWT Bearer 安全方案与按模块分组的 tag。服务启动后访问：

- Swagger UI：`http://127.0.0.1:7897/swagger-ui`
- OpenAPI JSON：`http://127.0.0.1:7897/api-docs/openapi.json`

> 在 Swagger UI 右上角 `Authorize` 填入登录返回的 JWT，即可调试受保护接口。

主要接口分组：

| 分组 | 路径前缀 |
| --- | --- |
| 健康检查 | `GET /health`、`/health/live`、`/health/ready` |
| 认证 | `POST /api/auth/register`、`/api/auth/login` |
| 用户 | `GET /api/users/me`、`/api/users` |
| 管理员 | `/api/admin/users`、`.../role`、`.../status`、`.../college` |
| 活动 / 成员 | `/api/activities`、`/api/activities/:id/members` |
| 场地预约 | `/api/venues`、`/api/venue-bookings`（approve / reject / cancel） |
| 设备借用 | `/api/devices`、`/api/device-borrows`（approve / reject / checkout / return / cancel） |
| 任务 / 进度 | `/api/tasks`、`/api/tasks/:id/status`、`/api/tasks/:id/progress-logs` |
| 操作日志 | `/api/operation-logs`、`/api/activities/:id/operation-logs` |
| 统计 | `/api/stats/overview`、`/api/stats/activities/:id`、`/api/stats/colleges` |

> 本地联调可使用 `integration_from_5_repos/rest_client/core_flow.http`（baseUrl 已指向 7897）。

---

## 数据库迁移

位于 `migrations/`，后端启动时按时间戳顺序自动执行：

| 文件 | 内容 |
| --- | --- |
| `20260411195800_create_users.sql` | 用户表 |
| `20260429110000_week5_7_core_modules.sql` | 活动 / 成员 / 场地 / 设备 / 任务 / 日志核心表 |
| `20260518090000_harden_tasks_members_logs.sql` | 统一任务状态约束、进度日志与操作日志字段强化、常用索引 |
| `20260518150000_add_college_to_users.sql` | 用户增加学院字段 |
| `20260519090000_productization_fields.sql` | 产品化字段补充 |
| `20260519110000_admin_user_management.sql` | 管理员用户管理相关字段 |

---

## 部署

### 后端（Render，使用 Dockerfile）

1. 准备 PostgreSQL（Render / Neon / Supabase / Railway 均可）。
2. Render 新建 Web Service，连接本仓库，构建方式选 `Dockerfile`（`render.yaml` 已提供模板）。
3. 配置环境变量：
   - `DATABASE_URL`、`JWT_SECRET`（设为 sync=false 的私密变量）
   - `APP_HOST=0.0.0.0`、`APP_PORT=7897`
   - `DATABASE_MAX_CONNECTIONS=10`
   - `FRONTEND_ORIGIN=https://你的前端域名`
   - `RUST_LOG=info,campus_collab_backend=debug,sqlx=warn`
4. 部署后在日志确认：Postgres 连接成功、迁移执行成功、服务监听 `0.0.0.0:7897`。
5. 用 `GET /health/ready` 验证服务与数据库连通。

### 前端（GitHub Pages / Vercel / Netlify）

- 本仓库已配置 GitHub Actions（`.github/workflows/deploy-frontend-pages.yml`），推送 `frontend/**` 自动构建并发布到 Pages。
- 在仓库 `Settings → Secrets and variables → Actions → Variables` 配置 `VITE_API_BASE_URL` 为后端公网地址。
- 若用 Vercel / Netlify：Root 设为 `frontend`，构建命令 `npm run build`，输出目录 `dist`，并设置 `VITE_API_BASE_URL`。

### 门户页（docs/）

更新 `docs/index.html` 中「进入系统」按钮链接与后端 API 地址为真实部署地址。

---

## 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin_demo` | `123456` | 管理员 |
| `teacher_demo` | `123456` | 教师 |
| `student_demo` | `123456` | 学生 |

---

## 主流程验收

1. 注册 / 登录
2. 创建活动
3. 添加成员
4. 创建场地预约 → 审批预约
5. 创建设备 → 申请借用 → 审批并借出 → 归还
6. 创建任务 → 指派任务 → 更新任务状态 → 添加进度记录
7. 查看活动操作日志
8. 查看统计数据
9. 打开前端地址演示完整流程
