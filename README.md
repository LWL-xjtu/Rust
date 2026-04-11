# 基于 Rust 的校园协作活动管理系统后端（初步框架）

本项目是课程阶段（第 3-4 周）可运行的后端骨架，已打通认证主线：

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`（Bearer Token）

技术栈：Rust + Axum + Tokio + SQLx + PostgreSQL + JWT + Argon2。

## 1. 环境准备

1. 安装 Rust（建议 stable）
2. 安装 PostgreSQL 并创建数据库，例如 `campus_collab`
3. 安装 `sqlx-cli`（可选，用于手动 migration 管理）：

```bash
cargo install sqlx-cli --no-default-features --features rustls,postgres
```

## 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

关键变量：

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_HOST`
- `APP_PORT`
- `RUST_LOG`

## 3. 执行 migration

方案 A（推荐）：项目启动时会自动执行 `migrations/` 下脚本，无需手动执行。

方案 B（手动执行）：

```bash
sqlx database create
sqlx migrate run
```

## 4. 启动项目

```bash
cargo run
```

默认监听：`http://127.0.0.1:8080`

## 5. 接口测试

### 健康检查

```bash
curl http://127.0.0.1:8080/health
```

### 注册

```bash
curl -X POST http://127.0.0.1:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"123456"}'
```

### 登录

```bash
curl -X POST http://127.0.0.1:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"123456"}'
```

返回中 `data.token` 即 JWT。

### 获取当前用户 `/me`

```bash
curl http://127.0.0.1:8080/api/users/me \
  -H "Authorization: Bearer <your_token>"
```

## 6. 目录结构（核心）

```text
src/
  config/       # 环境配置加载
  routes/       # 路由注册
  handlers/     # HTTP 处理层
  services/     # 业务逻辑层
  models/       # 数据库模型
  dto/          # 请求/响应 DTO
  middleware/   # JWT 提取器
  utils/        # JWT/密码工具
  errors/       # 统一错误处理
  state.rs      # 全局共享状态
  main.rs       # 入口
migrations/     # SQLx migration
```

## 7. 后续扩展建议

- 新增 `activity`、`venue`、`equipment`、`task` 模块并沿用同样分层。
- 在 JWT claims 中扩展权限字段，接入 RBAC。
- 增加集成测试与接口文档（OpenAPI）。
