import { useEffect, useMemo, useState, type FormEvent } from "react";

import { activitiesApi } from "../api/activities";
import { tasksApi } from "../api/tasks";
import { usersApi } from "../api/users";
import ApiError from "../components/ApiError";
import {
  EmptyState,
  PageHeader,
  ProgressRing,
  ResourceCard,
  StatCard,
  StatusChip,
  Timeline,
  type StatusTone,
  type VisualTone,
} from "../components/ui";

import "../styles/tasks.css";

type Task = {
  id: string;
  activity_id: string;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  creator_id?: string;
  priority?: string;
  due_time?: string | null;
  status?: string;
  created_at?: string;
};

type Activity = {
  id: string;
  title: string;
};

type User = {
  id: string;
  username?: string;
};

type ProgressLog = {
  id: string;
  task_id: string;
  user_id?: string;
  activity_id?: string;
  old_status?: string | null;
  new_status?: string | null;
  content?: string | null;
  created_at?: string;
};

type TaskForm = {
  activity_id: string;
  title: string;
  description: string;
  assignee_id: string;
  priority: string;
  due_time: string;
};

const initialForm: TaskForm = {
  activity_id: "",
  title: "",
  description: "",
  assignee_id: "",
  priority: "medium",
  due_time: "",
};

function statusTone(status?: string): StatusTone {
  if (status === "completed" || status === "finished") return "success";
  if (status === "cancelled" || status === "rejected" || status === "delayed") {
    return "danger";
  }
  if (status === "pending" || status === "draft") return "warning";
  if (status === "in_progress" || status === "ongoing" || status === "approved") {
    return "info";
  }
  return "neutral";
}

function statusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    draft: "草稿",
    approved: "已通过",
    in_progress: "进行中",
    ongoing: "进行中",
    completed: "已完成",
    finished: "已结束",
    delayed: "已延期",
    cancelled: "已取消",
    rejected: "已拒绝",
  };

  return map[status || ""] || status || "-";
}

function statusColumn(status?: string) {
  if (status === "completed" || status === "finished") return "done";
  if (status === "in_progress" || status === "ongoing" || status === "delayed") {
    return "active";
  }
  return "todo";
}

function priorityLabel(priority?: string) {
  const map: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "紧急",
  };

  return map[priority || ""] || priority || "-";
}

function priorityTone(priority?: string): StatusTone {
  if (priority === "urgent" || priority === "high") return "danger";
  if (priority === "medium") return "warning";
  if (priority === "low") return "success";
  return "neutral";
}

function taskTone(status?: string): VisualTone {
  const tone = statusTone(status);
  if (tone === "success") return "green";
  if (tone === "danger") return "rose";
  if (tone === "warning") return "amber";
  if (tone === "info") return "cyan";
  return "blue";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDateTimeValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function summary(value?: string | null) {
  const text = value?.trim();
  if (!text) return "暂无任务描述";
  if (text.length <= 72) return text;
  return `${text.slice(0, 72)}...`;
}

function progressPercent(status?: string) {
  const map: Record<string, number> = {
    pending: 20,
    in_progress: 65,
    ongoing: 65,
    delayed: 45,
    completed: 100,
    finished: 100,
    cancelled: 0,
    rejected: 0,
  };

  return map[status || ""] ?? 20;
}

function isoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function buildUpdatePayload(task: Task) {
  return {
    title: task.title,
    description: task.description || null,
    assignee_id: task.assignee_id || null,
    priority: task.priority,
    due_time: task.due_time || null,
    status: task.status,
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progressTask, setProgressTask] = useState<Task | null>(null);
  const [progressContent, setProgressContent] = useState("");
  const [progressStatus, setProgressStatus] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(initialForm);

  const userMap = useMemo(
    () =>
      Object.fromEntries(
        users.map((user) => [user.id, user.username || "未命名用户"]),
      ),
    [users],
  );

  const activityMap = useMemo(
    () =>
      Object.fromEntries(
        activities.map((activity) => [activity.id, activity.title]),
      ),
    [activities],
  );

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => statusColumn(task.status) === "todo"),
      active: tasks.filter((task) => statusColumn(task.status) === "active"),
      done: tasks.filter((task) => statusColumn(task.status) === "done"),
    }),
    [tasks],
  );

  const completedCount = groupedTasks.done.length;
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const timelineItems = useMemo(
    () =>
      logs.map((log) => {
        const task = tasks.find((item) => item.id === log.task_id);
        const statusChange =
          log.old_status || log.new_status
            ? `${statusLabel(log.old_status || undefined)} -> ${statusLabel(log.new_status || undefined)}`
            : "";

        return {
          id: log.id,
          title: task?.title || "任务进度",
          description: [
            userMap[log.user_id || ""] ? `提交人：${userMap[log.user_id || ""]}` : "",
            log.content || "无进度说明",
            statusChange,
          ]
            .filter(Boolean)
            .join(" · "),
          time: formatDate(log.created_at),
          tone: statusTone(log.new_status || undefined),
          badge: statusChange || "进度记录",
        };
      }),
    [logs, tasks, userMap],
  );

  const load = async () => {
    setError("");
    try {
      const [taskList, activityList, userList] = await Promise.all([
        tasksApi.list(),
        activitiesApi.list(),
        usersApi.list(),
      ]);

      setTasks(taskList as Task[]);
      setActivities(activityList as Activity[]);
      setUsers(userList as User[]);

      if (!form.activity_id && activityList.length > 0) {
        setForm((state) => ({ ...state, activity_id: activityList[0].id }));
      }

      if (!form.assignee_id && userList.length > 0) {
        setForm((state) => ({ ...state, assignee_id: userList[0].id }));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await tasksApi.create({
        activity_id: form.activity_id,
        title: form.title,
        description: form.description || null,
        assignee_id: form.assignee_id || null,
        priority: form.priority,
        due_time: isoOrNull(form.due_time),
      });
      setSuccess("任务创建成功");
      setForm({ ...form, title: "", description: "", due_time: "" });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const changeStatus = async (taskId: string, status: string) => {
    setError("");
    setSuccess("");

    try {
      await tasksApi.updateStatus(taskId, {
        status,
        comment: `状态改为 ${statusLabel(status)}`,
      });
      await load();
      setSuccess("任务状态已更新");
      setLogs((await tasksApi.getProgressLogs(taskId)) as ProgressLog[]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setError("");
    setSuccess("");

    try {
      await tasksApi.update(editing.id, buildUpdatePayload(editing));
      setEditing(null);
      setSuccess("任务已更新");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTask = async () => {
    if (!deleting) return;
    setError("");
    setSuccess("");

    try {
      await tasksApi.remove(deleting.id);
      setDeleting(null);
      setSuccess("任务已删除");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openProgress = async (task: Task) => {
    setProgressTask(task);
    setProgressContent("");
    setProgressStatus("");
    setError("");

    try {
      setLogs((await tasksApi.getProgressLogs(task.id)) as ProgressLog[]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submitProgress = async () => {
    if (!progressTask || !progressContent.trim()) return;
    setError("");
    setSuccess("");

    try {
      await tasksApi.addProgressLog(progressTask.id, {
        content: progressContent.trim(),
      });
      if (progressStatus) {
        await tasksApi.updateStatus(progressTask.id, {
          status: progressStatus,
          comment: progressContent.trim(),
        });
      }
      setProgressTask(null);
      setProgressContent("");
      setProgressStatus("");
      setSuccess("进度记录已提交");
      await load();
      setLogs((await tasksApi.getProgressLogs(progressTask.id)) as ProgressLog[]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderTaskCard = (task: Task) => (
    <ResourceCard
      key={task.id}
      title={task.title}
      description={summary(task.description)}
      icon="T"
      tone={taskTone(task.status)}
      meta={
        <div className="tasks-chip-row">
          <StatusChip tone={statusTone(task.status)}>
            {statusLabel(task.status)}
          </StatusChip>
          <StatusChip tone={priorityTone(task.priority)}>
            优先级：{priorityLabel(task.priority)}
          </StatusChip>
        </div>
      }
      footer={
        <div className="tasks-card-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setEditing({ ...task })}
          >
            编辑
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void changeStatus(task.id, "in_progress")}
          >
            开始
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void changeStatus(task.id, "completed")}
          >
            完成
          </button>
          <button type="button" onClick={() => void openProgress(task)}>
            写进度
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => setDeleting(task)}
          >
            删除
          </button>
        </div>
      }
    >
      <div className="tasks-card-details">
        <div>
          <span>所属活动</span>
          <strong>{activityMap[task.activity_id] || "未命名活动"}</strong>
        </div>
        <div>
          <span>负责人</span>
          <strong>{(task.assignee_id && userMap[task.assignee_id]) || "未分配"}</strong>
        </div>
        <div>
          <span>截止时间</span>
          <strong>{formatDate(task.due_time)}</strong>
        </div>
      </div>

      <div className="tasks-progress-track">
        <div style={{ width: `${progressPercent(task.status)}%` }} />
      </div>
      <div className="tasks-progress-caption">
        当前进度 {progressPercent(task.status)}%
      </div>
    </ResourceCard>
  );

  return (
    <section className="tasks-page page-stack">
      <PageHeader
        eyebrow="Tasks"
        title="任务分工"
        description="分配活动任务，跟踪负责人和完成进度。"
        actions={<StatusChip tone="info">{tasks.length} 个任务</StatusChip>}
      />

      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}

      <div className="tasks-metric-grid">
        <StatCard
          label="任务总数"
          value={tasks.length.toLocaleString("zh-CN")}
          description="当前可见任务"
          icon="T"
          tone="cyan"
        />
        <StatCard
          label="待处理"
          value={groupedTasks.todo.length.toLocaleString("zh-CN")}
          description="待推进的任务"
          icon="P"
          tone="amber"
        />
        <StatCard
          label="进行中"
          value={groupedTasks.active.length.toLocaleString("zh-CN")}
          description="正在执行或延期"
          icon="R"
          tone="blue"
        />
        <StatCard
          label="已完成"
          value={completedCount.toLocaleString("zh-CN")}
          description="完成或结束状态"
          icon="OK"
          tone="green"
        />
        <div className="tasks-rate-card">
          <ProgressRing
            value={completedCount}
            max={tasks.length}
            label={`${completionRate}%`}
            caption="完成率"
            tone={completionRate >= 75 ? "green" : "amber"}
            size={118}
          />
        </div>
      </div>

      <section className="tasks-create-panel">
        <div className="tasks-section-heading">
          <div>
            <h2>创建任务</h2>
            <p>选择活动、负责人和截止时间后创建新的任务分工。</p>
          </div>
        </div>

        <form className="tasks-form" onSubmit={createTask}>
          <label className="tasks-field">
            <span>所属活动</span>
            <select
              value={form.activity_id}
              onChange={(e) => setForm({ ...form, activity_id: e.target.value })}
              required
            >
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title}
                </option>
              ))}
            </select>
          </label>

          <label className="tasks-field tasks-field-wide">
            <span>任务标题</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="请输入任务标题"
              required
            />
          </label>

          <label className="tasks-field tasks-field-wide">
            <span>任务描述</span>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="请输入任务描述"
            />
          </label>

          <label className="tasks-field">
            <span>负责人</span>
            <select
              value={form.assignee_id}
              onChange={(e) =>
                setForm({ ...form, assignee_id: e.target.value })
              }
            >
              {users.map((user) => (
                <option value={user.id} key={user.id}>
                  {user.username || "未命名用户"}
                </option>
              ))}
            </select>
          </label>

          <label className="tasks-field">
            <span>优先级</span>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </label>

          <label className="tasks-field">
            <span>截止时间</span>
            <input
              type="datetime-local"
              value={form.due_time}
              onChange={(e) => setForm({ ...form, due_time: e.target.value })}
            />
          </label>

          <div className="tasks-form-actions">
            <button type="submit">创建任务</button>
          </div>
        </form>
      </section>

      <section className="tasks-board-panel">
        <div className="tasks-section-heading">
          <div>
            <h2>任务看板</h2>
            <p>按状态分区展示任务，保留编辑、删除、开始、完成和写进度操作。</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon="T"
            title="还没有任务"
            description="为活动创建第一个任务后，它会显示在任务看板中。"
          />
        ) : (
          <div className="tasks-board">
            <div className="tasks-board-column">
              <div className="tasks-column-head">
                <h3>待处理</h3>
                <StatusChip tone="warning">{groupedTasks.todo.length}</StatusChip>
              </div>
              {groupedTasks.todo.length === 0 ? (
                <EmptyState
                  icon="P"
                  title="暂无待处理任务"
                  description="新的待处理任务会显示在这里。"
                />
              ) : (
                groupedTasks.todo.map(renderTaskCard)
              )}
            </div>

            <div className="tasks-board-column">
              <div className="tasks-column-head">
                <h3>进行中</h3>
                <StatusChip tone="info">{groupedTasks.active.length}</StatusChip>
              </div>
              {groupedTasks.active.length === 0 ? (
                <EmptyState
                  icon="R"
                  title="暂无进行中任务"
                  description="点击任务卡片上的开始后会进入这里。"
                />
              ) : (
                groupedTasks.active.map(renderTaskCard)
              )}
            </div>

            <div className="tasks-board-column">
              <div className="tasks-column-head">
                <h3>已完成</h3>
                <StatusChip tone="success">{groupedTasks.done.length}</StatusChip>
              </div>
              {groupedTasks.done.length === 0 ? (
                <EmptyState
                  icon="OK"
                  title="暂无已完成任务"
                  description="完成后的任务会归入这里。"
                />
              ) : (
                groupedTasks.done.map(renderTaskCard)
              )}
            </div>
          </div>
        )}
      </section>

      <section className="tasks-log-panel">
        <div className="tasks-section-heading">
          <div>
            <h2>最近进度日志</h2>
            <p>选择任务并提交进度后，最近记录会以时间线展示。</p>
          </div>
          <StatusChip tone="info">{logs.length} 条</StatusChip>
        </div>

        {timelineItems.length === 0 ? (
          <EmptyState
            icon="L"
            title="暂无进度记录"
            description="任务提交进度后会显示在这里。"
          />
        ) : (
          <Timeline items={timelineItems} />
        )}
      </section>

      {editing ? (
        <div className="modal-mask">
          <div className="modal-card tasks-modal-card">
            <h3>编辑任务</h3>

            <label className="tasks-field">
              <span>任务标题</span>
              <input
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                placeholder="任务标题"
              />
            </label>

            <label className="tasks-field">
              <span>任务描述</span>
              <input
                value={editing.description || ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                placeholder="任务描述"
              />
            </label>

            <label className="tasks-field">
              <span>负责人</span>
              <select
                value={editing.assignee_id || ""}
                onChange={(e) =>
                  setEditing({ ...editing, assignee_id: e.target.value })
                }
              >
                {users.map((user) => (
                  <option value={user.id} key={user.id}>
                    {user.username || "未命名用户"}
                  </option>
                ))}
              </select>
            </label>

            <div className="tasks-modal-grid">
              <label className="tasks-field">
                <span>优先级</span>
                <select
                  value={editing.priority || "medium"}
                  onChange={(e) =>
                    setEditing({ ...editing, priority: e.target.value })
                  }
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </label>

              <label className="tasks-field">
                <span>截止时间</span>
                <input
                  type="datetime-local"
                  value={toLocalDateTimeValue(editing.due_time)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      due_time: isoOrNull(e.target.value),
                    })
                  }
                />
              </label>
            </div>

            <label className="tasks-field">
              <span>状态</span>
              <select
                value={editing.status || "pending"}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
              >
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="delayed">已延期</option>
                <option value="cancelled">已取消</option>
              </select>
            </label>

            <div className="btn-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(null)}
              >
                取消
              </button>
              <button type="button" onClick={saveEdit}>
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleting ? (
        <div className="modal-mask">
          <div className="modal-card tasks-modal-card">
            <h3>确认删除</h3>
            <p>确定删除任务「{deleting.title}」吗？</p>

            <div className="btn-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleting(null)}
              >
                取消
              </button>
              <button type="button" className="btn-danger" onClick={deleteTask}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {progressTask ? (
        <div className="modal-mask">
          <div className="modal-card tasks-modal-card">
            <h3>填写任务进度</h3>
            <div className="tasks-progress-summary">
              <strong>{progressTask.title}</strong>
              <StatusChip tone={statusTone(progressTask.status)}>
                {statusLabel(progressTask.status)}
              </StatusChip>
            </div>

            <label className="tasks-field">
              <span>进度说明</span>
              <textarea
                rows={4}
                value={progressContent}
                onChange={(e) => setProgressContent(e.target.value)}
                placeholder="请输入进度说明"
              />
            </label>

            <label className="tasks-field">
              <span>状态变化</span>
              <select
                value={progressStatus}
                onChange={(e) => setProgressStatus(e.target.value)}
              >
                <option value="">不修改</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="delayed">已延期</option>
              </select>
            </label>

            <div className="btn-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setProgressTask(null)}
              >
                取消
              </button>
              <button type="button" onClick={submitProgress}>
                提交进度
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
