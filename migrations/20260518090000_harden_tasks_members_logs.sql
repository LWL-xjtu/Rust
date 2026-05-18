ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_status_check;

UPDATE tasks SET status='pending' WHERE status='todo';
UPDATE tasks SET status='completed' WHERE status='done';

ALTER TABLE tasks
    ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('pending','in_progress','completed','delayed','cancelled'));

ALTER TABLE task_progress_logs
    RENAME COLUMN operator_id TO user_id;

ALTER TABLE task_progress_logs
    RENAME COLUMN comment TO content;

ALTER TABLE task_progress_logs
    ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;

UPDATE task_progress_logs l
SET activity_id = t.activity_id
FROM tasks t
WHERE l.task_id = t.id AND l.activity_id IS NULL;

ALTER TABLE task_progress_logs
    ALTER COLUMN activity_id SET NOT NULL;

ALTER TABLE operation_logs
    RENAME COLUMN operator_id TO actor_id;

ALTER TABLE operation_logs
    ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_activity_members_user_id ON activity_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_progress_logs_task_id ON task_progress_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_logs_activity_id ON task_progress_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_logs_created_at ON task_progress_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operation_logs_actor_id ON operation_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_activity_id ON operation_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at DESC);
