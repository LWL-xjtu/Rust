import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/admin";
import ApiError from "../components/ApiError";
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatusChip,
  type StatusTone,
} from "../components/ui";
import { zhRole } from "../utils/display";
import "../styles/admin-users.css";

type AdminUser = {
  id: string;
  username?: string;
  email?: string;
  college?: string;
  role?: string;
  is_active?: boolean;
};

function roleTone(role?: string): StatusTone {
  if (role === "admin") return "admin";
  if (role === "teacher") return "teacher";
  if (role === "student") return "student";
  return "neutral";
}

function avatarText(username?: string) {
  const name = (username || "U").trim();
  return name ? name.slice(0, 1).toUpperCase() : "U";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
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

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const students = users.filter((u) => u.role === "student").length;
    const active = users.filter((u) => u.is_active).length;
    const disabled = users.filter((u) => !u.is_active).length;

    return { total, admins, students, active, disabled };
  }, [users]);

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

  const hasSearch = keyword.trim().length > 0;

  return (
    <div className="admin-users-page page-stack">
      <PageHeader
        eyebrow="Access Control"
        title="用户与权限管理"
        description="管理系统成员角色、状态和权限范围。"
        meta={<StatusChip tone="info">{filtered.length} 个成员</StatusChip>}
      />

      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}

      <section className="admin-users-metric-grid" aria-label="用户统计">
        <StatCard
          label="用户总数"
          value={stats.total}
          description="当前系统成员数量"
          icon="U"
          tone="cyan"
        />
        <StatCard
          label="管理员"
          value={stats.admins}
          description="拥有后台管理权限"
          icon="A"
          tone="violet"
        />
        <StatCard
          label="学生"
          value={stats.students}
          description="学生角色账号数量"
          icon="S"
          tone="green"
        />
        <StatCard
          label="启用用户"
          value={stats.active}
          description="当前可正常登录"
          icon="ON"
          tone="blue"
        />
        <StatCard
          label="禁用用户"
          value={stats.disabled}
          description="已被限制使用"
          icon="!"
          tone="rose"
        />
      </section>

      <section className="admin-users-filter-panel">
        <div>
          <h2>成员筛选</h2>
          <p>按用户名、邮箱或学院/书院快速定位系统成员。</p>
        </div>
        <label className="admin-users-search">
          <span>搜索关键词</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索用户名/邮箱/学院"
          />
        </label>
      </section>

      <section className="admin-users-list-panel">
        <div className="admin-users-section-heading">
          <div>
            <h2>成员列表</h2>
            <p>查看成员所属学院、角色状态，并直接调整权限。</p>
          </div>
          <StatusChip tone={hasSearch ? "warning" : "neutral"}>
            {hasSearch ? "筛选结果" : "全部用户"}
          </StatusChip>
        </div>

        {filtered.length > 0 ? (
          <div className="admin-users-grid">
            {filtered.map((u) => (
              <article className="admin-user-card" key={u.id}>
                <div className="admin-user-card-head">
                  <div className="admin-user-avatar" aria-hidden="true">
                    {avatarText(u.username)}
                  </div>
                  <div className="admin-user-title">
                    <h3>{u.username || "未命名用户"}</h3>
                    <p>{u.email || "未填写邮箱"}</p>
                  </div>
                  <StatusChip tone={u.is_active ? "success" : "danger"}>
                    {u.is_active ? "启用" : "禁用"}
                  </StatusChip>
                </div>

                <div className="admin-user-meta-grid">
                  <div>
                    <span>学院/书院</span>
                    <strong>{u.college || "未填写"}</strong>
                  </div>
                  <div>
                    <span>角色</span>
                    <strong>
                      <StatusChip tone={roleTone(u.role)}>{zhRole(u.role)}</StatusChip>
                    </strong>
                  </div>
                </div>

                <div className="admin-user-actions">
                  <label>
                    <span>角色调整</span>
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="student">学生</option>
                      <option value="teacher">教师</option>
                      <option value="admin">管理员</option>
                    </select>
                  </label>
                  <button
                    className={u.is_active ? "btn-danger" : "btn-secondary"}
                    onClick={() => updateStatus(u.id, !u.is_active)}
                  >
                    {u.is_active ? "禁用" : "启用"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="U"
            title={hasSearch ? "没有找到匹配用户" : "暂无用户"}
            description={
              hasSearch
                ? "请尝试更换关键词。"
                : "系统成员创建后，会显示在这里。"
            }
          />
        )}
      </section>
    </div>
  );
}
