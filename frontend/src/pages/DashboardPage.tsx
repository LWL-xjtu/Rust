import { useEffect, useMemo, useState } from "react";

import { authApi } from "../api/auth";
import { logsApi } from "../api/logs";
import { statsApi } from "../api/stats";
import type { User } from "../api/types";
import ApiError from "../components/ApiError";
import Loading from "../components/Loading";
import { zhAction, zhRole } from "../utils/display";

import "../styles/log-tables.css";

type Overview = {
  activities_count?: number;
  venue_bookings_count?: number;
  device_borrows_count?: number;
  tasks_count?: number;
  tasks_done_count?: number;
  users_count?: number;
};

type OperationLog = {
  id: string;
  actor_id?: string | null;
  activity_id?: string | null;
  target_type?: string;
  target_id?: string | null;
  action?: string;
  summary?: string;
  metadata?: unknown;
  created_at?: string;
};

function isPrivilegedRole(role?: string) {
  return role === "teacher" || role === "admin";
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function targetLabel(value?: string) {
  const map: Record<string, string> = {
    activity: "活动",
    task: "任务",
    venue: "场地",
    venue_booking: "场地预约",
    device: "设备",
    device_borrow: "设备借用",
    member: "成员",
    user: "用户",
  };

  return map[value || ""] || value || "-";
}

function actionClassName(action?: string) {
  if (!action) return "console-action-badge";

  if (["create", "add_member", "apply", "add_progress"].includes(action)) {
    return "console-action-badge console-action-create";
  }

  if (["approve", "checkout", "return", "completed"].includes(action)) {
    return "console-action-badge console-action-success";
  }

  if (["reject", "delete", "cancel", "remove_member"].includes(action)) {
    return "console-action-badge console-action-danger";
  }

  if (["update", "status_update"].includes(action)) {
    return "console-action-badge console-action-update";
  }

  return "console-action-badge";
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<User | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [error, setError] = useState("");

  const canViewAdminInfo = isPrivilegedRole(me?.role);

  const recentLogs = useMemo(() => {
    return logs.slice(0, 10);
  }, [logs]);

  useEffect(() => {
    const load = async () => {
      setError("");
      setLoading(true);

      try {
        const userInfo = (await authApi.me()) as User;
        setMe(userInfo);

        if (isPrivilegedRole(userInfo.role)) {
          try {
            const [statsInfo, logList] = await Promise.all([
              statsApi.overview(),
              logsApi.list(),
            ]);

            setOverview(statsInfo as Overview);
            setLogs(logList as OperationLog[]);
          } catch (err: unknown) {
            setOverview(null);
            setLogs([]);
            setError(
              err instanceof Error ? err.message : "管理数据加载失败",
            );
          }
        } else {
          setOverview(null);
          setLogs([]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "仪表盘加载失败");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return <Loading text="仪表盘加载中..." />;
  }

  return (
    <section className="dashboard-page page-stack">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">DASHBOARD</p>
          <h1>仪表盘</h1>
          <p className="page-description">
            当前用户：{me?.username || "-"}（{zhRole(me?.role || "-")}）
          </p>
        </div>
      </div>

      <ApiError error={error} />

      {canViewAdminInfo ? (
        <div className="dashboard-metric-grid">
          <div className="dashboard-metric-card">
            <span>活动总数</span>
            <strong>{overview?.activities_count ?? "-"}</strong>
            <small>全部校园活动</small>
          </div>

          <div className="dashboard-metric-card">
            <span>场地预约数</span>
            <strong>{overview?.venue_bookings_count ?? "-"}</strong>
            <small>场地申请与审批</small>
          </div>

          <div className="dashboard-metric-card">
            <span>设备借用数</span>
            <strong>{overview?.device_borrows_count ?? "-"}</strong>
            <small>设备借用记录</small>
          </div>

          <div className="dashboard-metric-card">
            <span>任务总数</span>
            <strong>{overview?.tasks_count ?? "-"}</strong>
            <small>活动任务数量</small>
          </div>

          <div className="dashboard-metric-card">
            <span>已完成任务</span>
            <strong>{overview?.tasks_done_count ?? "-"}</strong>
            <small>完成进度统计</small>
          </div>

          {me?.role === "admin" ? (
            <div className="dashboard-metric-card">
              <span>用户总数</span>
              <strong>{overview?.users_count ?? "-"}</strong>
              <small>系统成员数量</small>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="dashboard-metric-grid">
          <div className="dashboard-metric-card">
            <span>我的可用功能</span>
            <strong>活动</strong>
            <small>查看和参与校园活动</small>
          </div>

          <div className="dashboard-metric-card">
            <span>我的可用功能</span>
            <strong>场地</strong>
            <small>查看和申请场地预约</small>
          </div>

          <div className="dashboard-metric-card">
            <span>我的可用功能</span>
            <strong>设备</strong>
            <small>查看和申请设备借用</small>
          </div>

          <div className="dashboard-metric-card">
            <span>我的可用功能</span>
            <strong>任务</strong>
            <small>查看和处理分配任务</small>
          </div>
        </div>
      )}

      {canViewAdminInfo ? (
        <div className="panel console-log-panel">
          <div className="console-section-header">
            <div>
              <h2>最近操作日志</h2>
              <p>仅教师 / 管理员可见，学生账号不会显示该模块。</p>
            </div>

            <span className="console-table-count">{recentLogs.length} 条</span>
          </div>

          {recentLogs.length === 0 ? (
            <div className="console-empty">
              <div>🧾</div>
              <strong>暂无最近操作日志</strong>
              <p>完成活动、任务、场地或设备操作后，这里会显示记录。</p>
            </div>
          ) : (
            <div className="console-table-wrap">
              <table className="console-table dashboard-log-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>操作</th>
                    <th>资源类型</th>
                    <th>目标 ID</th>
                    <th>摘要</th>
                  </tr>
                </thead>

                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="console-time-cell">
                        {formatDate(log.created_at)}
                      </td>

                      <td>
                        <span className={actionClassName(log.action)}>
                          {zhAction(log.action)}
                        </span>
                      </td>

                      <td>{targetLabel(log.target_type)}</td>

                      <td className="console-id-cell">
                        {shortId(log.target_id)}
                      </td>

                      <td className="console-summary-cell">
                        {log.summary || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
