use axum::{http::StatusCode, Json};
use sqlx::PgPool;

use crate::models::category::{Category, CreateCategory, UpdateCategory};

pub async fn get_categories_handler(pool: &PgPool) -> Result<Json<Vec<Category>>, StatusCode> {
    let category_records = sqlx::query!("SELECT * FROM categories")
        .fetch_all(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    let categories = category_records.into_iter().map(|record| Category {
        id: record.id,
        name: record.name,
        color: record.color.unwrap_or_default(),
        created_at: record.created_at.unwrap_or_else(|| chrono::Utc::now()),
        user_id: record.user_id,
    }).collect::<Vec<Category>>();

    Ok(Json(categories))
}

pub async fn create_category_handler(
    payload: CreateCategory,
    user_id: i32, // Add user_id parameter
    pool: &PgPool,
) -> Result<Json<Category>, StatusCode> {
    // Create category
    let category_record = sqlx::query!(
        "INSERT INTO categories (name, color, user_id) VALUES ($1, $2, $3) RETURNING id, name, color, created_at, updated_at, user_id",
        payload.name,
        payload.color,
        user_id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| {
        eprintln!("Database error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    
    let category = Category {
        id: category_record.id,
        name: category_record.name,
        color: category_record.color.unwrap_or_default(),
        created_at: category_record.created_at.unwrap_or_else(|| chrono::Utc::now()),
        user_id: category_record.user_id,
    };

    Ok(Json(category))
}

pub async fn get_category_handler(id: i32, pool: &PgPool) -> Result<Json<Category>, StatusCode> {
    let category_record = sqlx::query!("SELECT * FROM categories WHERE id = $1", id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match category_record {
        Some(record) => {
            let category = Category {
                id: record.id,
                name: record.name,
                color: record.color.unwrap_or_default(),
                created_at: record.created_at.unwrap_or_else(|| chrono::Utc::now()),
                user_id: record.user_id,
            };
            Ok(Json(category))
        },
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn update_category_handler(
    id: i32,
    payload: UpdateCategory,
    user_id: i32, // Add user_id parameter
    pool: &PgPool,
) -> Result<Json<Category>, StatusCode> {
    // Check if category exists and belongs to the user
    let category_record = sqlx::query!("SELECT * FROM categories WHERE id = $1 AND user_id = $2", id, user_id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    let category = category_record.map(|record| Category {
        id: record.id,
        name: record.name,
        color: record.color.unwrap_or_default(),
        created_at: record.created_at.unwrap_or_else(|| chrono::Utc::now()),
        user_id: record.user_id,
    });

    if category.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Update category
    let category = sqlx::query!("UPDATE categories SET name = COALESCE($1, name), color = COALESCE($2, color), updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING id, name, color, created_at, user_id",
        payload.name,
        payload.color,
        id,
        user_id
    )
    .fetch_one(pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Convert to Category struct
    let category = Category {
        id: category.id,
        name: category.name,
        color: category.color.unwrap_or_default(),
        created_at: category.created_at.unwrap_or_else(|| chrono::Utc::now()),
        user_id: category.user_id,
    };

    Ok(Json(category))
}

pub async fn delete_category_handler(
    id: i32,
    user_id: i32, // Add user_id parameter
    pool: &PgPool,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Check if category exists and belongs to the user
    let category_record = sqlx::query!("SELECT * FROM categories WHERE id = $1 AND user_id = $2", id, user_id)
        .fetch_optional(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if category_record.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Check if there are tasks using this category
    let tasks_count = sqlx::query!("SELECT COUNT(*) FROM tasks WHERE category_id = $1", id)
        .fetch_one(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if tasks_count.count.unwrap_or(0) > 0 {
        return Err(StatusCode::BAD_REQUEST); // Cannot delete category with tasks
    }

    // Delete category
    let result = sqlx::query!("DELETE FROM categories WHERE id = $1 AND user_id = $2", id, user_id)
        .execute(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(serde_json::json!({
        "message": format!("Success deleted category with id {}", id)
    })))
}