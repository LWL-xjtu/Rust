# 🦀 Backend API with Rust and Axum

This is a backend project developed entirely in **Rust**, employing the **Axum** library for HTTP requests and **PostgreSQL** as database. It is a simple CRUD API that allows users to **create, read, update, and delete** daily tasks.

## 🚀 Features

- Fully written in **Rust** with **Axum**.
- Scalable architecture based on **modules**.
- Async queries for **PostgreSQL** database by using **sqlx**.
- Efficient **error handling** and **validations**.
- RESTful endpoints following best practices.

## 📁 Project Structure

```plaintext
📂 src
├── 📂 handlers       # API handlers
├── 📂 routes         # API routes
├── 📂 db             # PostgreSQL connection
├── 📂 models         # Structure definitions and schemas
├── config.rs         # App configuration (environment variables, DB, etc.)
├── main.rs           # App entry point
└── server.rs         # App server starter
```

## Prerequisites

Make sure you have the following installed on your system:

- Rust (https://www.rust-lang.org/tools/install)
- PostgreSQL (https://www.postgresql.org/download/)

## 🛠️ Installation and Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/hmanzoni/rust-axum-postgres.git
cd rust-axum-postgres
```

### 2️⃣ Configure environment variables

Create a `.env` file in the project root with the following configuration:

```env
DATABASE_URL=postgres://axum_postgres:axum_postgres@127.0.0.1:5432/axum_postgres
SERVER_ADDRESS=127.0.0.1:3000
```

### 3️⃣ Database Configuration

Create a PostgreSQL database and user by executing the following SQL commands in your PostgreSQL shell or client:

```sql
-- create user
CREATE ROLE axum_postgres WITH LOGIN PASSWORD 'axum_postgres';

-- create database
CREATE DATABASE axum_postgres WITH OWNER = 'axum_postgres';

-- in your axum_postgres database
-- create task table
CREATE TABLE tasks (
  task_id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  priority INT
);

### 4️⃣ Install dependencies

Make sure you have **Rust** and **Cargo** installed, then run:

```bash
cargo build
```

### 5️⃣ Run the application

```bash
cargo run
```

The API will be available at `http://localhost:3000`.

## 📝 Endpoints

| Method | Route         | Description       |
| ------ | ------------- | ----------------- |
| GET    | `/tasks`      | Get all tasks     |
| POST   | `/tasks`      | Create a new task |
| PUT    | `/tasks/{id}` | Update a task     |
| DELETE | `/tasks/{id}` | Delete a task     |

## 🛠 Technologies Used

- **Rust** 🦀
- **Axum** (HTTP framework)
- **Tokio** (Asynchronous runtime)
- **sqlx** (ORM for PostgreSQL)
- **dotenvy** (Environment variable management)

## 📌 Notes

Initially, I started this project as a single `main.rs` file then when I refactored it, I partitioned everything into modules to make it more scalable.

## 📜 License

This project is licensed under the MIT license.

---

✨ Feel free to contribute or leave a ⭐ on GitHub! ✨
