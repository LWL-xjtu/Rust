import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { activitiesApi } from "../api/activities";
import ApiError from "../components/ApiError";

export default function ActivitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState("general");
  const nav = useNavigate();

  const sorted = useMemo(() => [...items].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))), [items]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await activitiesApi.list());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await activitiesApi.create({
        title,
        description: description || null,
        activity_type: activityType,
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateTitle = async (activity: any) => {
    const next = prompt("新标题", activity.title);
    if (!next || next === activity.title) return;
    try {
      await activitiesApi.update(activity.id, { title: next });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeActivity = async (activity: any) => {
    if (!confirm(`确认删除活动：${activity.title} ？`)) return;
    try {
      await activitiesApi.remove(activity.id);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>活动管理</h2>
      <form onSubmit={createActivity}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="活动标题" required />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="活动描述（可选）" />
        <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
          <option value="general">general</option>
          <option value="course">course</option>
          <option value="meeting">meeting</option>
        </select>
        <button type="submit">创建活动</button>
      </form>

      <ApiError error={error} />
      {loading ? <p>加载中...</p> : null}

      <table className="table">
        <thead>
          <tr>
            <th>标题</th>
            <th>类型</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.activity_type}</td>
              <td><span className={`status status-${a.status}`}>{a.status}</span></td>
              <td>
                <button onClick={() => nav(`/activities/${a.id}`)}>详情</button>
                <button onClick={() => updateTitle(a)}>改标题</button>
                <button onClick={() => removeActivity(a)}>删除</button>
              </td>
            </tr>
          ))}
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={4}>暂无活动，先创建一个活动。</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
