import { useEffect, useState } from "react";
import { activitiesApi } from "../api/activities";
import { tasksApi } from "../api/tasks";
import { usersApi } from "../api/users";
import ApiError from "../components/ApiError";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activityId, setActivityId] = useState("");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [t, a, u] = await Promise.all([tasksApi.list(), activitiesApi.list(), usersApi.list()]);
      setTasks(t);
      setActivities(a);
      setUsers(u);
      if (!activityId && a.length > 0) setActivityId(a[0].id);
      if (!assignee && u.length > 0) setAssignee(u[0].id);
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
        activity_id: activityId,
        title,
        assignee_id: assignee || null,
        priority: "medium",
      });
      setTitle("");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const changeStatus = async (taskId: string, status: string) => {
    try {
      await tasksApi.updateStatus(taskId, { status, comment: `set by ui: ${status}` });
      await load();
      setLogs(await tasksApi.getProgressLogs(taskId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addProgress = async (taskId: string) => {
    const comment = prompt("进度说明");
    if (!comment) return;
    try {
      await tasksApi.addProgressLog(taskId, { content: comment });
      setLogs(await tasksApi.getProgressLogs(taskId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>任务分工</h2>
      <ApiError error={error} />

      <form onSubmit={createTask}>
        <select value={activityId} onChange={(e) => setActivityId(e.target.value)} required>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="任务标题" required />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          {users.map((u) => <option value={u.id} key={u.id}>{u.username}</option>)}
        </select>
        <button type="submit">创建任务</button>
      </form>

      <table className="table">
        <thead><tr><th>标题</th><th>状态</th><th>负责人</th><th>操作</th></tr></thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td><span className={`status status-${t.status}`}>{t.status}</span></td>
              <td>{t.assignee_id || "-"}</td>
              <td>
                <button onClick={() => changeStatus(t.id, "in_progress")}>进行中</button>
                <button onClick={() => changeStatus(t.id, "completed")}>完成</button>
                <button onClick={() => addProgress(t.id)}>写进度</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>最近查看任务的进度日志</h3>
      <ul>{logs.map((l) => <li key={l.id}>{l.created_at} | {l.old_status || "-"} {"->"} {l.new_status || "-"} | {l.content || ""}</li>)}</ul>
    </div>
  );
}

