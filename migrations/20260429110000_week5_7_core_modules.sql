CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    activity_type VARCHAR(64) NOT NULL DEFAULT 'general',
    owner_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ongoing','finished','cancelled')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time)
);

CREATE TABLE IF NOT EXISTS activity_members (
    id UUID PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    member_role VARCHAR(32) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (activity_id, user_id)
);

CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'available' CHECK (status IN ('available','unavailable','maintenance')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venue_bookings (
    id UUID PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activities(id),
    venue_id UUID NOT NULL REFERENCES venues(id),
    applicant_id UUID NOT NULL REFERENCES users(id),
    approver_id UUID REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    serial_no VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'available' CHECK (status IN ('available','pending','borrowed','maintenance','disabled')),
    description TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_borrows (
    id UUID PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activities(id),
    device_id UUID NOT NULL REFERENCES devices(id),
    borrower_id UUID NOT NULL REFERENCES users(id),
    approver_id UUID REFERENCES users(id),
    borrow_time TIMESTAMPTZ,
    expected_return_time TIMESTAMPTZ NOT NULL,
    actual_return_time TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','borrowed','returned','cancelled')),
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    priority VARCHAR(16) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
    due_time TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','delayed','cancelled')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_progress_logs (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES users(id),
    old_status VARCHAR(32),
    new_status VARCHAR(32),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operation_logs (
    id UUID PRIMARY KEY,
    operator_id UUID REFERENCES users(id),
    target_type VARCHAR(64) NOT NULL,
    target_id UUID,
    action VARCHAR(64) NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activity_members_activity_id ON activity_members(activity_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_venue_id ON venue_bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_activity_id ON venue_bookings(activity_id);
CREATE INDEX IF NOT EXISTS idx_device_borrows_device_id ON device_borrows(device_id);
CREATE INDEX IF NOT EXISTS idx_tasks_activity_id ON tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_target ON operation_logs(target_type, target_id);

DROP TRIGGER IF EXISTS activities_set_updated_at ON activities;
CREATE TRIGGER activities_set_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS venues_set_updated_at ON venues;
CREATE TRIGGER venues_set_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS venue_bookings_set_updated_at ON venue_bookings;
CREATE TRIGGER venue_bookings_set_updated_at BEFORE UPDATE ON venue_bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS devices_set_updated_at ON devices;
CREATE TRIGGER devices_set_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS device_borrows_set_updated_at ON device_borrows;
CREATE TRIGGER device_borrows_set_updated_at BEFORE UPDATE ON device_borrows FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;
CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

