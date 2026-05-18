import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { activitiesApi } from "../api/activities";
import ApiError from "../components/ApiError";
import { COLLEGE_OPTIONS, zhStatus } from "../utils/display";

export default function ActivitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    activity_type: "general",
    college: "钱学森书院",
    customCollege: "",
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
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

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const college = form.college === "其他" ? form.customCollege : form.college;
    try {
      await activitiesApi.create({
        title: form.title,
        description: form.description || null,
        activity_type: form.activity_type,
        college: college || null,
      });
      setSuccess("活动创建成功");
      setForm({ ...form, title: "", description: "" });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await activitiesApi.update(editing.id, editing);
      setEditing(null);
      setSuccess("活动已更新");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await activitiesApi.remove(deleting.id);
      setDeleting(null);
      setSuccess("活动已删除");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>活动管理</h2>
      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}
      <div className="panel">
        <h3>创建活动</h3>
        <form onSubmit={submitCreate}>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="活动标题"
            required
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="活动描述"
          />
          <select
            value={form.activity_type}
            onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
          >
            <option value="general">综合活动</option>
            <option value="course">课程活动</option>
            <option value="meeting">会议活动</option>
          </select>
          <select value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })}>
            {COLLEGE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {form.college === "其他" ? (
            <input
              value={form.customCollege}
              onChange={(e) => setForm({ ...form, customCollege: e.target.value })}
              placeholder="请输入学院/书院"
            />
          ) : null}
          <button type="submit">创建活动</button>
        </form>
      </div>

      {loading ? <p>加载中...</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>标题</th>
            <th>学院/书院</th>
            <th>类型</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.college || "未填写"}</td>
              <td>{a.activity_type}</td>
              <td>
                <span className={`status status-${a.status}`}>{zhStatus(a.status)}</span>
              </td>
              <td>
                <button onClick={() => nav(`/activities/${a.id}`)}>详情</button>
                <button onClick={() => setEditing({ ...a })}>编辑</button>
                <button className="btn-danger" onClick={() => setDeleting(a)}>
                  删除
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td colSpan={5}>暂无数据，请先创建活动。</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <div className="modal-mask">
          <div className="modal-card">
            <h3>编辑活动</h3>
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="活动标题"
            />
            <input
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="活动描述"
            />
            <input
              value={editing.college || ""}
              onChange={(e) => setEditing({ ...editing, college: e.target.value })}
              placeholder="学院/书院"
            />
            <div className="btn-row">
              <button onClick={() => setEditing(null)} className="btn-secondary">
                取消
              </button>
              <button onClick={saveEdit}>保存</button>
            </div>
          </div>
        </div>
      ) : null}

      {deleting ? (
        <div className="modal-mask">
          <div className="modal-card">
            <h3>确认删除</h3>
            <p>确定删除活动「{deleting.title}」吗？</p>
            <div className="btn-row">
              <button onClick={() => setDeleting(null)} className="btn-secondary">
                取消
              </button>
              <button onClick={doDelete} className="btn-danger">
                确认删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
