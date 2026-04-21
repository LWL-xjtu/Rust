use axum::Router;
use sqlx::PgPool;

use crate::routes::tasks;

pub fn app_router(db_pool: PgPool) -> Router {
  Router::new()
    .merge(
      tasks::tasks_routes()
    )
    .with_state(db_pool)
}
