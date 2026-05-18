import { useEffect, useMemo, useState } from "react";
import { activitiesApi } from "../api/activities";
import { tasksApi } from "../api/tasks";
import { usersApi } from "../api/users";
import ApiError from "../components/ApiError";
import { zhStatus } from "../utils/display";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progressTask, setProgressTask] = useState<any | null>(null);
  const [progressContent, setProgressContent] = useState("");
  const [progressStatus, setProgressStatus] = useState("");
  const [form, setForm] = useState({
    activity_id: "",
    title: "",
    description: "",
    assignee_id: "",
    priority: "medium",
    due_time: "",
  });

  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.username || "未命名用户"])),
    [users],
  );
  const activityMap = useMemo(() => Object.fromEntries(activities.map((a) => [a.id, a.title])), [activities]);

  const load = async () => {
    setError("");
    try {
      const [t, a, u] = await Promise.all([tasksApi.list(), activitiesApi.list(), usersApi.list()]);
      setTasks(t);
      setActivities(a);
      setUsers(u);
      if (!form.activity_id && a.length > 0) setForm((s) => ({ ...s, activity_id: a[0].id }));
      if (!form.assignee_id && u.length > 0) setForm((s) => ({ ...s, assignee_id: u[0].id }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tasksApi.create({
        activity_id: form.activity_id,
        title: form.title,
        description: form.description || null,
        assignee_id: form.assignee_id || null,
        priority: form.priority,
        due_time: form.due_time ? new Date(form.due_time).toISOString() : null,
      });
      setSuccess("任务创建成功");
      setForm({ ...form, title: "", description: "", due_time: "" });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const changeStatus = async (taskId: string, status: string) => {
    try {
      await tasksApi.updateStatus(taskId, { status, comment: `状态改为${zhStatus(status)}` });
      await load();
      setSuccess("任务状态已更新");
      setLogs(await tasksApi.getProgressLogs(taskId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submitProgress = async () => {
    if (!progressTask || !progressContent.trim()) return;
    try {
      await tasksApi.addProgressLog(progressTask.id, { content: progressContent.trim() });
      if (progressStatus) {
        await tasksApi.updateStatus(progressTask.id, { status: progressStatus, comment: progressContent.trim() });
      }
      setProgressTask(null);
      setProgressContent("");
      setProgressStatus("");
      setSuccess("进度记录已提交");
      await load();
      setLogs(await tasksApi.getProgressLogs(progressTask.id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>任务分工</h2>
      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}

      <div className="panel">
        <h3>创建任务</h3>
        <form onSubmit={createTask}>
          <select value={form.activity_id} onChange={(e) => setForm({ ...form, activity_id: e.target.value })} required>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="任务标题" required />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="任务描述" />
          <select value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
            {users.map((u) => (
              <option value={u.id} key={u.id}>
                {u.username}
              </option>
            ))}
          </select>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
          <input type="datetime-local" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} />
          <button type="submit">创建任务</button>
        </form>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>任务标题</th>
            <th>所属活动</th>
            <th>状态</th>
            <th>优先级</th>
            <th>负责人</th>
            <th>截止时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{activityMap[t.activity_id] || "未命名活动"}</td>
              <td>
                <span className={`status status-${t.status}`}>{zhStatus(t.status)}</span>
              </td>
              <td>{t.priority}</td>
              <td>{(t.assignee_id && userMap[t.assignee_id]) || "未分配"}</td>
              <td>{t.due_time ? new Date(t.due_time).toLocaleString("zh-CN") : "-"}</td>
              <td>
                <button onClick={() => changeStatus(t.id, "in_progress")}>开始</button>
                <button onClick={() => changeStatus(t.id, "completed")}>完成</button>
                <button onClick={() => setProgressTask(t)}>写进度</button>
              </td>
            </tr>
          ))}
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={7}>暂无数据，请先创建任务。</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="panel">
        <h3>最近进度日志</h3>
        <ul>
          {logs.map((l) => (
            <li key={l.id}>
              {new Date(l.created_at).toLocaleString("zh-CN")} | {zhStatus(l.old_status)} → {zhStatus(l.new_status)} |{" "}
              {l.content || "无说明"}
            </li>
          ))}
        </ul>
        {logs.length === 0 ? <p>暂无数据，请先选择任务并提交进度。</p> : null}
      </div>

      {progressTask ? (
        <div className="modal-mask">
          <div className="modal-card">
            <h3>填写任务进度</h3>
            <p>任务名称：{progressTask.title}</p>
            <p>当前状态：{zhStatus(progressTask.status)}</p>
            <textarea
              rows={4}
              value={progressContent}
              onChange={(e) => setProgressContent(e.target.value)}
              placeholder="请输入进度说明"
            />
            <select value={progressStatus} onChange={(e) => setProgressStatus(e.target.value)}>
              <option value="">不修改</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="delayed">已延期</option>
            </select>
            <div className="btn-row">
              <button className="btn-secondary" onClick={() => setProgressTask(null)}>
                取消
              </button>
              <button onClick={submitProgress}>提交进度</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
