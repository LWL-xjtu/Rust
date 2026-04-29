# Campus Collaboration Full-Flow System (Rust + React)

本仓库是课程项目的完整实现：

- 后端：Rust + Axum + SQLx + PostgreSQL
- 前端：Vite + React + TypeScript（真实可交互）
- 展示入口：`docs/index.html`（提供“进入系统”按钮，跳转真实前端地址）

## 1. 仓库内容

- `src/`：后端代码
- `migrations/`：数据库迁移脚本
- `frontend/`：前端产品代码
- `docs/`：GitHub Pages 门户页（非假数据页，提供真实入口）
- `scripts/seed.sql`：演示数据辅助脚本
- `Dockerfile` / `render.yaml`：后端部署文件

## 2. 当前后端能力（Week 3-7）

### Auth
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

### Venues / Bookings
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

### Devices / Borrows
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

### Tasks / Logs / Stats
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
- `POST /api/tasks/{id}/status`
- `POST /api/tasks/{id}/progress-logs`
- `GET /api/tasks/{id}/progress-logs`
- `GET /api/activities/{id}/tasks`
- `GET /api/operation-logs`
- `GET /api/activities/{id}/operation-logs`
- `GET /api/stats/overview`
- `GET /api/stats/activities/{id}`

## 3. 后端本地运行

### 3.1 环境变量
复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

关键变量：

- `DATABASE_URL`
- `JWT_SECRET`
- `RUST_LOG`
- `APP_HOST`
- `APP_PORT`
- `FRONTEND_ORIGIN`

### 3.2 迁移与启动

```bash
cargo run
```

启动时会自动执行 `migrations/`。

### 3.3 质量检查

```bash
cargo fmt
cargo check
cargo test
```

## 4. 前端本地运行

进入前端目录：

```bash
cd frontend
npm install
```

复制前端环境变量：

```bash
cp .env.example .env
```

设置：

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_PRODUCT_URL=https://your-frontend-domain.example.com
```

开发启动：

```bash
npm run dev
```

构建：

```bash
npm run build
```

## 5. 演示账号与 Seed

建议先通过前端或 API 注册三个用户：

- `admin_demo / 123456`
- `teacher_demo / 123456`
- `student_demo / 123456`

然后执行：

```sql
-- scripts/seed.sql
```

将角色更新为 admin/teacher/student，并插入示例场地和设备。

## 6. 真实 URL 生成方案（推荐）

> GitHub Pages 只能静态托管前端，不能运行 Rust 后端。生产方案应为“前后端分离部署”。

### 6.1 后端部署（Render）

1. 在 Render 新建 Web Service，连接本仓库。
2. 使用 Docker 部署（仓库已提供 `Dockerfile` 和 `render.yaml`）。
3. 配置环境变量：
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `RUST_LOG`
   - `APP_HOST=0.0.0.0`
   - `APP_PORT=8080`
   - `DATABASE_MAX_CONNECTIONS`
   - `FRONTEND_ORIGIN=https://你的前端域名`
4. 部署成功后获得后端 URL，例如：
   - `https://your-backend.onrender.com`

### 6.2 数据库部署（Render PostgreSQL / Neon / Supabase / Railway）

1. 创建 PostgreSQL 实例。
2. 获取连接串，填入 `DATABASE_URL`。
3. 启动后端时会自动执行 migration。

### 6.3 前端部署（Vercel/Netlify）

1. 导入 GitHub 仓库。
2. `Root Directory` 设为 `frontend`。
3. 构建命令 `npm run build`，输出目录 `dist`。
4. 配置环境变量：
   - `VITE_API_BASE_URL=https://你的后端地址`
5. 部署后得到前端 URL，例如：
   - `https://your-frontend.vercel.app`

### 6.4 GitHub Pages 门户

`docs/index.html` 提供“进入系统”按钮。部署完成后把占位地址替换为真实前端 URL。

## 7. GitHub Pages 设置（部署前端真实产品页）

1. 打开仓库 `Settings` -> `Pages`
2. `Source` 选择 `GitHub Actions`
3. 到仓库 `Settings` -> `Secrets and variables` -> `Actions` -> `Variables` 新建：
   - `VITE_API_BASE_URL=https://你的后端地址`
4. 推送到 `main` 后会自动触发工作流 `.github/workflows/deploy-frontend-pages.yml`
5. 部署成功后访问：`https://lwl-xjtu.github.io/Rust/`

> 这个地址就是可交互前端产品页，不再只是静态介绍页。

## 8. 主流程验收建议

1. 注册
2. 登录
3. 创建活动
4. 添加成员
5. 创建场地预约
6. 审批预约
7. 创建设备
8. 申请借用
9. 审批并借出
10. 归还设备
11. 创建任务
12. 更新任务状态
13. 查看操作日志
14. 查看统计数据
15. 打开前端真实 URL 进行全流程演示

