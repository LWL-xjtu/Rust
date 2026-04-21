# Task Management System

A full-stack task management application built with Rust (backend) and modern frontend technologies.

## Project Structure

- `TASK_MANAGEMENT/` - Root directory containing both frontend and backend
  - `backend/` - Rust Axum backend with PostgreSQL database
  - `frontend/` - (To be added) Modern web frontend

## Features

- User authentication (register/login)
- JWT-based session management
- Task creation, reading, updating, and deletion (CRUD)
- Category and tag organization for tasks
- RESTful API design

## Branches

- `main` - Root project structure and documentation
- `backend` - Rust Axum backend implementation
- `frontend` - Web frontend implementation

## Getting Started

### Backend

1. Navigate to the backend directory:
   ```bash
   cd TASK_MANAGEMENT/backend
   ```

2. Set up environment variables:
   Create a `.env` file with:
   ```
   DATABASE_URL=postgresql://username:password@localhost/database_name
   JWT_SECRET=your_jwt_secret_here
   SERVER_HOST=127.0.0.1
   SERVER_PORT=3000
   ```

3. Run database migrations:
   ```bash
   sqlx migrate run
   ```

4. Build and run the server:
   ```bash
   cargo run
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user information

### Categories
- `GET /api/categories` - Get all categories for the current user
- `POST /api/categories` - Create a new category
- `GET /api/categories/:id` - Get a specific category
- `PUT /api/categories/:id` - Update a specific category
- `DELETE /api/categories/:id` - Delete a specific category

### Tags
- `GET /api/tags` - Get all tags for the current user
- `POST /api/tags` - Create a new tag
- `GET /api/tags/:id` - Get a specific tag
- `PUT /api/tags/:id` - Update a specific tag
- `DELETE /api/tags/:id` - Delete a specific tag

### Tasks
- `GET /api/task` - Get all tasks for the current user
- `POST /api/task` - Create a new task
- `GET /api/task/:id` - Get a specific task
- `PUT /api/task/:id` - Update a specific task
- `DELETE /api/task/:id` - Delete a specific task

## Technologies Used

### Backend
- Rust
- Axum web framework
- PostgreSQL database
- SQLx for database queries
- Serde for serialization/deserialization
- JSON Web Tokens (JWT) for authentication
- Bcrypt for password hashing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.