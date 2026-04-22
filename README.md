# 基于 Rust 的校园协作活动管理系统后端

这是课程项目后端仓库，当前已完成第 3-4 周主线，并进入“任务布置与分工执行”阶段。

## 当前阶段结论

- 认证主线已跑通：`register -> login -> JWT -> /me`
- 工程骨架已稳定：分层结构 + 统一错误 + 统一响应
- 参考仓库整合已完成：5 个 Axum/Postgres 仓库已纳入项目资产
- 项目推进状态：已完成任务拆解并进入成员分工执行

## 已完成功能（可演示）

- `GET /health`
- `GET /health/live`
- `GET /health/ready`（含数据库 readiness 检查）
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

统一响应格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

## 五仓库合并这一步做了什么

### 1) 源码整合（完整拉入本仓库）

已将以下参考仓库完整引入到 `vendor/`：

- `vendor/axum-rest-api-sample`
- `vendor/rust-axum-postgres`
- `vendor/rust-axum-postgres-api`
- `vendor/axum-template`
- `vendor/task_management`

### 2) 主工程吸收了可运行能力（非仅存链接）

- 引入 CORS 中间件
  - 文件：`src/routes/mod.rs`、`Cargo.toml`
- 增加健康检查增强接口
  - `GET /health/live`
  - `GET /health/ready`
  - 文件：`src/handlers/health_handler.rs`、`src/routes/health_routes.rs`
- 编译检查通过：`cargo check`

### 3) 形成可交接整合包

目录：`integration_from_5_repos/`

- `README.md`：整合总说明
- `docs/repo_goal_mapping.md`：项目目标与仓库能力映射
- `docs/adoption_backlog.md`：分阶段落地清单
- `rest_client/core_flow.http`：联调请求样例
- `scripts/sync_vendor_repos.ps1`：一键同步脚本

## 当前进展：已到任务布置阶段

当前已完成任务拆解和分工，进入并行开发执行：

1. 成员一：架构整合与主分支质量把关
2. 成员二：认证与权限（JWT/RBAC 细化）
3. 成员三：核心业务模块开发（活动/场地/设备/任务）
4. 成员四：接口联调、测试记录、文档整理

## 下一阶段（Week 5-7）重点

1. Week 5：活动管理 + 场地预约
2. Week 6：设备借用管理（申请/审批/借出/归还）
3. Week 7：任务分工与过程留痕（task_logs/operation_logs）

## 本地运行

### 1) 配置环境变量

复制示例文件：

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

### 2) 启动

```bash
cargo run
```

默认地址：`http://127.0.0.1:8080`

### 3) 快速联调

可直接使用：

- `integration_from_5_repos/rest_client/core_flow.http`
- `extras_for_team/02_auth_api_test/auth_flow.ps1`

## 仓库结构（核心）

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
vendor/
integration_from_5_repos/
```

## 技术栈

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
