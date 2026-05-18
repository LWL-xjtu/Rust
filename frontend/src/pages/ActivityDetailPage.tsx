import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { activitiesApi } from "../api/activities";
import { usersApi } from "../api/users";
import ApiError from "../components/ApiError";

export default function ActivityDetailPage() {
  const { id = "" } = useParams();
  const [activity, setActivity] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [memberUserId, setMemberUserId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    if (!id) return;
    setError("");
    try {
      const [a, t, l, m, u] = await Promise.all([
        activitiesApi.get(id),
        activitiesApi.tasks(id),
        activitiesApi.logs(id),
        activitiesApi.listMembers(id),
        usersApi.list(),
      ]);
      setActivity(a);
      setTasks(t);
      setLogs(l);
      setMembers(m);
      setUsers(u);
      if (!memberUserId && u.length > 0) setMemberUserId(u[0].id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!activity) return <div>加载中...</div>;

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberUserId) return;
    try {
      await activitiesApi.addMember(id, { user_id: memberUserId, member_role: "member" });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("确认移除该成员？")) return;
    try {
      await activitiesApi.removeMember(id, userId);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>活动详情</h2>
      <ApiError error={error} />

      <div className="panel">
        <p><b>标题：</b>{activity.title}</p>
        <p><b>状态：</b><span className={`status status-${activity.status}`}>{activity.status}</span></p>
        <p><b>类型：</b>{activity.activity_type}</p>
        <p><b>描述：</b>{activity.description || "-"}</p>
      </div>

      <h3>成员管理</h3>
      <form onSubmit={addMember}>
        <select value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)}>
          {users.map((u) => (
            <option value={u.id} key={u.id}>
              {u.username} ({u.role}) - {u.college || "未填写"}
            </option>
          ))}
        </select>
        <button type="submit">添加成员</button>
      </form>
      <table className="table">
        <thead><tr><th>user_id</th><th>角色</th><th>加入时间</th><th>操作</th></tr></thead>
        <tbody>
          {members.map((m) => (
            <tr key={`${m.activity_id}-${m.user_id}`}>
              <td>{m.user_id}</td>
              <td>{m.member_role}</td>
              <td>{m.joined_at}</td>
              <td>{m.member_role === "owner" ? "-" : <button onClick={() => removeMember(m.user_id)}>移除</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>任务摘要</h3>
      <ul>{tasks.map((t) => <li key={t.id}>{t.title} - {t.status}</li>)}</ul>

      <h3>操作日志</h3>
      <ul>{logs.map((l) => <li key={l.id}>{l.created_at} | {l.summary}</li>)}</ul>
    </div>
  );
}
