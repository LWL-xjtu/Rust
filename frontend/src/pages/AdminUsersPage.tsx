import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/admin";
import ApiError from "../components/ApiError";
import { zhRole } from "../utils/display";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setUsers(await adminApi.users());
    } catch (e: any) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const k = keyword.trim();
    if (!k) return users;
    return users.filter((u) =>
      [u.username, u.email, u.college].some((v) => String(v || "").includes(k)),
    );
  }, [users, keyword]);

  const updateRole = async (id: string, role: string) => {
    try {
      await adminApi.updateRole(id, role);
      setSuccess("角色已更新");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };
  const updateStatus = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateStatus(id, isActive);
      setSuccess("用户状态已更新");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2>用户与权限管理</h2>
      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索用户名/邮箱/学院" />
      <table className="table">
        <thead>
          <tr><th>用户名</th><th>邮箱</th><th>学院/书院</th><th>角色</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email || "-"}</td>
              <td>{u.college || "未填写"}</td>
              <td>{zhRole(u.role)}</td>
              <td>{u.is_active ? "启用" : "禁用"}</td>
              <td>
                <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}>
                  <option value="student">学生</option><option value="teacher">教师</option><option value="admin">管理员</option>
                </select>
                <button className="btn-secondary" onClick={() => updateStatus(u.id, !u.is_active)}>{u.is_active ? "禁用" : "启用"}</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 ? <tr><td colSpan={6}>暂无用户数据。</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
