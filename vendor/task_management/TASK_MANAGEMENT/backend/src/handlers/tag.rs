use axum::{http::StatusCode, Json};
use sqlx::PgPool;

use crate::models::tag::{Tag, CreateTag, UpdateTag};

pub async fn get_tags_handler(pool: &PgPool) -> Result<Json<Vec<Tag>>, StatusCode> {
    let tag_records = sqlx::query!("SELECT * FROM tags")
        .fetch_all(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    let tags = tag_records.into_iter().map(|record| Tag {
        id: record.id,
        name: record.name,
        color: record.color.unwrap_or_default(),
        created_at: record.created_at.unwrap_or_else(|| chrono::Utc::now()),
        user_id: record.user_id,
    }).collect::<Vec<Tag>>();

    Ok(Json(tags))
}

pub async fn create_tag_handler(
    payload: CreateTag,
    user_id: i32, // Add user_id parameter
    pool: &PgPool,
) -> Result<Json<Tag>, StatusCode> {
    let tag_record = sqlx::query!(
        r#"
        INSERT INTO tags (name, color, user_id)
        VALUES ($1, $2, $3)
        RETURNING id, name, color, created_at, updated_at, user_id
        "#,
        payload.name,
        payload.color.unwrap_or("#000000".to_string()),
        user_id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| {
        eprintln!("Database error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    
    let tag = Tag {
        id: tag_record.id,
        name: tag_record.name,
        color: tag_record.color.unwrap_or_default(),
        created_at: tag_record.created_at.unwrap_or_else(|| chrono::Utc::now()),
        user_id: tag_record.user_id,
    };

    Ok(Json(tag))
}

pub async fn get_tag_handler(id: i32, pool: &PgPool) -> Result<Json<Tag>, StatusCode> {
    // Check if tag exists
    let tag_record = sqlx::query!("SELECT * FROM tags WHERE id = $1", id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    match tag_record {
        Some(record) => {
            let tag = Tag {
                id: record.id,
                name: record.name,
                color: record.color.unwrap_or_default(),
                created_at: record.created_at.unwrap_or_else(|| chrono::Utc::now()),
                user_id: record.user_id,
            };
            Ok(Json(tag))
        },
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn update_tag_handler(
    id: i32,
    payload: UpdateTag,
    user_id: i32, // Add user_id parameter
    pool: &PgPool,
) -> Result<Json<Tag>, StatusCode> {
    // Check if tag exists and belongs to the user
    let tag_record = sqlx::query!("SELECT * FROM tags WHERE id = $1 AND user_id = $2", id, user_id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    if tag_record.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Update tag
    let tag_record = sqlx::query!("UPDATE tags SET name = COALESCE($1, name), color = COALESCE($2, color), updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING id, name, color, created_at, user_id",
        payload.name,
        payload.color,
        id,
        user_id
    )
    .fetch_one(pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Convert to Tag struct
    let tag = Tag {
        id: tag_record.id,
        name: tag_record.name,
        color: tag_record.color.unwrap_or_default(),
        created_at: tag_record.created_at.unwrap_or_else(|| chrono::Utc::now()),
        user_id: tag_record.user_id,
    };

    Ok(Json(tag))
}

pub async fn delete_tag_handler(
    id: i32,
    user_id: i32, // Add user_id parameter
    pool: &PgPool,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Check if tag exists and belongs to the user
    let tag_record = sqlx::query!("SELECT * FROM tags WHERE id = $1 AND user_id = $2", id, user_id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    if tag_record.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Delete tag-task relationships first
    sqlx::query!("DELETE FROM task_tags WHERE tag_id = $1", id)
        .execute(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Delete tag
    let result = sqlx::query!("DELETE FROM tags WHERE id = $1 AND user_id = $2", id, user_id)
        .execute(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(serde_json::json!({
        "message": format!("Success deleted tag with id {}", id)
    })))
}


pub async fn get_tags_by_user_id(
    pool: &PgPool,
    user_id: i32,
) -> Result<Json<Vec<Tag>>, StatusCode> {
    // Get all tags for user
    let tag_records = sqlx::query!("SELECT * FROM tags WHERE user_id = $1", user_id)
        .fetch_all(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    let tags = tag_records.into_iter().map(|record| Tag {
        id: record.id,
        name: record.name,
        color: record.color.unwrap_or_default(),
        created_at: record.created_at.unwrap_or_else(|| chrono::Utc::now()),
        user_id: record.user_id,
    }).collect::<Vec<Tag>>();

    Ok(Json(tags))
}