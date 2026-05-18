ALTER TABLE users
    ADD COLUMN IF NOT EXISTS college TEXT;

CREATE INDEX IF NOT EXISTS idx_users_college ON users(college);
