use crate::models::task::{CreateTaskReq, CreateTaskRow, TaskRow, UpdateTaskReq};

use axum::{
  Json,
  extract::{Path, State},
  http::StatusCode,
};

use serde_json::json;

use sqlx::PgPool;

pub async fn get_tasks(
  State(pg_pool): State<PgPool>,
) -> Result<(StatusCode, String), (StatusCode, String)> {
  let rows = sqlx::query_as!(TaskRow, "SELECT * FROM tasks ORDER BY task_id")
    .fetch_all(&pg_pool)
    .await
    .map_err(|e| {
      (
        StatusCode::INTERNAL_SERVER_ERROR,
        json!({"success": false, "message": e.to_string()}).to_string(),
      )
    })?;
  Ok((
    StatusCode::OK,
    json!({"success": true, "data": rows}).to_string(),
  ))
}

pub async fn create_task(
  State(pg_pool): State<PgPool>,
  Json(task): Json<CreateTaskReq>,
) -> Result<(StatusCode, String), (StatusCode, String)> {
  let row = sqlx::query_as!(
    CreateTaskRow,
    "INSERT INTO tasks (name, priority) VALUES ($1, $2) RETURNING task_id",
    task.name,
    task.priority
  )
  .fetch_one(&pg_pool)
  .await
  .map_err(|e| {
    (
      StatusCode::INTERNAL_SERVER_ERROR,
      json!({"success": false, "message": e.to_string()}).to_string(),
    )
  })?;
  Ok((
    StatusCode::OK,
    json!({"success": true, "data": row}).to_string(),
  ))
}

pub async fn update_task(
  State(pg_pool): State<PgPool>,
  Path(task_id): Path<i32>,
  Json(task): Json<UpdateTaskReq>,
) -> Result<(StatusCode, String), (StatusCode, String)> {
  let mut query = "UPDATE tasks SET task_id = $1".to_owned();
  let mut i = 2;
  if task.name.is_some() {
    query.push_str(&format!(", name = ${i}"));
    i = i + 1;
  };

  if task.priority.is_some() {
    query.push_str(&format!(", priority = ${i}"));
  }

  query.push_str(&format!(" WHERE task_id = $1"));

  let mut s = sqlx::query(&query).bind(task_id);

  if task.name.is_some() {
    s = s.bind(task.name);
  };

  if task.priority.is_some() {
    s = s.bind(task.priority);
  }

  s.execute(&pg_pool).await.map_err(|e| {
    (
      StatusCode::INTERNAL_SERVER_ERROR,
      json!({"success": false, "message": e.to_string()}).to_string(),
    )
  })?;

  Ok((StatusCode::OK, json!({"success": true}).to_string()))
}

pub async fn delete_task(
  State(pg_pool): State<PgPool>,
  Path(task_id): Path<i32>,
) -> Result<(StatusCode, String), (StatusCode, String)> {
  sqlx::query!("DELETE FROM tasks WHERE task_id = $1", task_id)
    .execute(&pg_pool)
    .await
    .map_err(|e| {
      (
        StatusCode::INTERNAL_SERVER_ERROR,
        json!({"success": false, "message": e.to_string()}).to_string(),
      )
    })?;

  Ok((StatusCode::OK, json!({"success": true}).to_string()))
}
