# integration_from_5_repos

这个目录用于把你指定的 5 个开源仓库“真正加入到当前课程项目”并可追踪：

1. 源码已拉取到 `vendor/`
2. 已在主工程合并部分可落地能力（CORS、health/live、health/ready）
3. 提供能力映射、落地清单、后续合并脚本

## 已拉取仓库（vendor）

- `vendor/axum-rest-api-sample`
- `vendor/rust-axum-postgres`
- `vendor/rust-axum-postgres-api`
- `vendor/axum-template`
- `vendor/task_management`

## 你现在能直接汇报

- 我们不是只贴链接，而是把外部仓库源码拉进本地项目，形成可追踪依赖参考。
- 已按项目目标吸收实践并合并进现有代码：
  - CORS 中间件
  - `GET /health/live`
  - `GET /health/ready`（含数据库就绪检查）
- 后续 Week5-7（活动/场地/设备/任务）的对照接入清单已经给出。
