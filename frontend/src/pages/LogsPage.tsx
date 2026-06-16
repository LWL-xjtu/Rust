import { useEffect, useMemo, useState } from "react";

import { activitiesApi } from "../api/activities";
import { logsApi } from "../api/logs";
import ApiError from "../components/ApiError";
import { zhAction } from "../utils/display";

type ActivityOption = {
  id: string;
  title: string;
};

type OperationLog = {
  id: string;
  actor_id?: string | null;
  activity_id?: string | null;
  target_type: string;
  target_id?: string | null;
  action: string;
  summary: string;
  metadata?: unknown;
  created_at: string;
};

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
  if (!action) return "log-action";

  if (["create", "add_member", "apply", "add_progress"].includes(action)) {
    return "log-action log-action-create";
  }

  if (["approve", "checkout", "return", "completed"].includes(action)) {
    return "log-action log-action-success";
  }

  if (["reject", "delete", "cancel", "remove_member"].includes(action)) {
    return "log-action log-action-danger";
  }

  if (["update", "status_update"].includes(action)) {
    return "log-action log-action-update";
  }

  return "log-action";
}

function formatMetadata(metadata: unknown) {
  if (!metadata) return "-";

  if (typeof metadata === "string") {
    return metadata.trim() || "-";
  }

  if (typeof metadata === "object") {
    const entries = Object.entries(metadata as Record<string, unknown>);

    if (entries.length === 0) return "-";

    return entries
      .slice(0, 4)
      .map(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          return `${key}: -`;
        }

        if (typeof value === "object") {
          return `${key}: ${JSON.stringify(value)}`;
        }

        return `${key}: ${String(value)}`;
      })
      .join(" / ");
  }

  return String(metadata);
}

export default function LogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const [activityId, setActivityId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"all" | "activity">("all");

  const totalCount = logs.length;

  const latestTime = useMemo(() => {
    if (logs.length === 0) return "-";

    return formatDate(
      [...logs].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0]?.created_at,
    );
  }, [logs]);

  const activityMap = useMemo(() => {
    const map = new Map<string, string>();

    activities.forEach((activity) => {
      map.set(activity.id, activity.title);
    });

    return map;
  }, [activities]);

  const loadAll = async () => {
    setError("");
    setLoading(true);
    setMode("all");

    try {
      const [logList, activityList] = await Promise.all([
        logsApi.list(),
        activitiesApi.list(),
      ]);

      setLogs(logList as OperationLog[]);
      setActivities(activityList as ActivityOption[]);

      if (!activityId && (activityList as ActivityOption[]).length > 0) {
        setActivityId((activityList as ActivityOption[])[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "操作日志加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const filterByActivity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activityId) {
      setError("请先选择一个活动");
      return;
    }

    setError("");
    setLoading(true);
    setMode("activity");

    try {
      const logList = await logsApi.byActivity(activityId);
      setLogs(logList as OperationLog[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "活动日志加载失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">USAGE LOGS</p>
          <h1>操作日志</h1>
          <p className="page-description">
            按照 Token 使用日志的形式展示系统后端业务操作记录，便于审计活动、场地、设备和任务流转。
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={loadAll}>
          刷新日志
        </button>
      </div>

      <ApiError error={error} />

      <div className="metric-grid">
        <div className="metric-card">
          <span>日志总数</span>
          <strong>{totalCount}</strong>
          <small>{mode === "activity" ? "当前活动筛选结果" : "全部操作记录"}</small>
        </div>

        <div className="metric-card">
          <span>最新记录时间</span>
          <strong>{latestTime}</strong>
          <small>按后端 created_at 字段统计</small>
        </div>

        <div className="metric-card">
          <span>活动数量</span>
          <strong>{activities.length}</strong>
          <small>可按活动查看日志明细</small>
        </div>
      </div>

      <div className="panel toolbar-panel">
        <form className="console-toolbar" onSubmit={filterByActivity}>
          <div className="toolbar-field">
            <label htmlFor="activity-filter">活动筛选</label>
            <select
              id="activity-filter"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
            >
              {activities.length === 0 ? (
                <option value="">暂无可筛选活动</option>
              ) : null}

              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-actions">
            <button type="submit">按活动筛选</button>
            <button type="button" className="btn-secondary" onClick={loadAll}>
              查看全部
            </button>
          </div>
        </form>
      </div>

      <div className="panel table-panel">
        <div className="table-panel-header">
          <div>
            <h2>后端操作日志输出</h2>
            <p>表格字段对齐 Token 使用日志风格：时间、动作、资源、操作者、摘要和详细参数。</p>
          </div>

          <span className="table-count">{logs.length} 条记录</span>
        </div>

        {loading ? (
          <div className="loading">日志加载中...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h3>暂无操作日志</h3>
            <p>完成活动创建、审批、任务流转等操作后，这里会自动显示记录。</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table log-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作</th>
                  <th>资源类型</th>
                  <th>活动</th>
                  <th>操作者</th>
                  <th>目标 ID</th>
                  <th>摘要</th>
                  <th>详细参数</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="time-cell">{formatDate(log.created_at)}</td>
                    <td>
                      <span className={actionClassName(log.action)}>
                        {zhAction(log.action)}
                      </span>
                    </td>
                    <td>{targetLabel(log.target_type)}</td>
                    <td>{log.activity_id ? activityMap.get(log.activity_id) || shortId(log.activity_id) : "-"}</td>
                    <td>{shortId(log.actor_id)}</td>
                    <td>{shortId(log.target_id)}</td>
                    <td className="summary-cell">{log.summary || "-"}</td>
                    <td className="metadata-cell">{formatMetadata(log.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
