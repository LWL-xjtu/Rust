# 基于 Rust 的校园协作活动管理系统后端

本项目是课程设计后端工程，目标是围绕“协作活动”主线，逐步实现用户认证、场地预约、设备借用、任务分工与过程留痕等能力。

## 一、项目目标（依据计划书）

最终交付聚焦 6 类成果：

1. 可运行的 Rust 后端服务
2. 完整数据库设计与迁移脚本
3. 核心业务接口（认证 + 活动 + 资源 + 任务）
4. 接口文档（OpenAPI/Swagger）
5. 测试与联调记录
6. 部署与答辩材料

项目实施原则：先稳定工程骨架，再逐步挂接业务模块，确保可演示、可测试、可扩展。

## 二、阶段进展（当前到第 3-4 周）

### 第 1 周：需求分析与边界收敛（已完成）

- 明确核心对象：用户、活动、成员、场地、设备、任务、日志
- 确认业务主线：所有预约/借用/任务都围绕 `activity_id` 关联

### 第 2 周：总体设计与数据库建模（已完成）

- 确定分层架构：`routes -> handlers -> services -> models/dto`
- 明确技术栈：Rust + Axum + SQLx + PostgreSQL + JWT + Argon2
- 完成核心实体草案（users/activities/venues/devices/tasks/logs）

### 第 3 周：工程骨架搭建（已完成）

- Rust 项目初始化与目录结构落地
- PostgreSQL 连接池与 `dotenvy` 配置
- SQLx 迁移机制接入
- 统一错误与统一响应结构落地

### 第 4 周：认证模块启动（已完成主线）

- 用户注册
- 用户登录
- JWT 签发与鉴权提取
- 当前用户信息 `/api/users/me`
- 健康检查接口

## 三、当前状态：已进入“任务布置/分工执行”

当前项目处于第 3-4 周过渡完成状态，已开始并行执行后续任务。

### 本阶段可运行能力

- `GET /health`
- `GET /health/live`
- `GET /health/ready`（包含数据库 readiness 检查）
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

### 任务布置（当前执行）

1. 架构与整合
- 维护主干稳定、控制模块合并顺序、保证接口风格一致

2. 认证与权限
- 继续细化 JWT 与角色权限边界（student/teacher/admin）

3. 核心业务开发预备
- 活动、场地、设备、任务模块的数据层与接口分批落地

4. 联调与文档
- 接口测试记录、环境说明、答辩材料整理

## 四、下一阶段计划（Week 5-7）

### Week 5：活动与场地预约

- 活动 CRUD
- 活动成员管理
- 场地预约申请/审批/取消
- 预留冲突检测逻辑

### Week 6：设备借用管理

- 设备信息管理
- 借用申请
- 审批、借出、归还状态流转
- 历史查询

### Week 7：任务分工与留痕

- 任务创建与分配
- 任务状态更新
- 进度日志记录
- 关键操作日志落库

## 五、项目结构（当前）

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
integration_from_5_repos/
vendor/
```

## 六、环境与启动

### 1. 配置环境变量

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

至少配置：

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_HOST`
- `APP_PORT`
- `RUST_LOG`

### 2. 运行迁移与服务

项目启动时会自动执行 `migrations/`。

```bash
cargo run
```

默认地址：`http://127.0.0.1:8080`

## 七、快速联调

### 健康检查

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/health/live
curl http://127.0.0.1:8080/health/ready
```

### 注册/登录/me

```bash
curl -X POST http://127.0.0.1:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"123456"}'

curl -X POST http://127.0.0.1:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"123456"}'

curl http://127.0.0.1:8080/api/users/me \
  -H "Authorization: Bearer <token>"
```
