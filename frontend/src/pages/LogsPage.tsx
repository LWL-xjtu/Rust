import { useEffect, useMemo, useState, type FormEvent } from "react";

import { activitiesApi } from "../api/activities";
import { logsApi } from "../api/logs";
import ApiError from "../components/ApiError";
import {
  EmptyState,
  PageHeader,
  ResourceCard,
  StatCard,
  StatusChip,
  Timeline,
  type StatusTone,
} from "../components/ui";

import "../styles/logs.css";

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
    activity_member: "活动成员",
    task_progress_log: "任务进度",
  };

  return map[value || ""] || value || "-";
}

function actionLabel(action?: string) {
  const map: Record<string, string> = {
    create: "创建",
    update: "更新",
    delete: "删除",
    add_member: "添加成员",
    remove_member: "移除成员",
    status_update: "状态更新",
    add_progress: "提交进度",
    approve: "审批通过",
    reject: "拒绝",
    cancel: "取消",
    apply: "发起申请",
    checkout: "确认借出",
    return: "确认归还",
    completed: "完成",
  };

  return map[action || ""] || action || "-";
}

function actionTone(action?: string): StatusTone {
  if (["create", "add_member", "add_progress"].includes(action || "")) {
    return "info";
  }

  if (["approve", "checkout", "return", "completed"].includes(action || "")) {
    return "success";
  }

  if (["reject", "delete", "cancel", "remove_member"].includes(action || "")) {
    return "danger";
  }

  if (["update", "status_update", "apply"].includes(action || "")) {
    return "warning";
  }

  return "neutral";
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
      .slice(0, 6)
      .map(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          return `${key}: -`;
        }

        if (typeof value === "object") {
          return `${key}: ${JSON.stringify(value)}`;
        }

        return `${key}: ${String(value)}`;
      })
      .join("\n");
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

  const actionTypeCount = useMemo(() => {
    return new Set(logs.map((log) => log.action).filter(Boolean)).size;
  }, [logs]);

  const involvedActivityCount = useMemo(() => {
    return new Set(logs.map((log) => log.activity_id).filter(Boolean)).size;
  }, [logs]);

  const timelineItems = useMemo(() => {
    return logs.map((log) => ({
      id: log.id,
      title: log.summary || actionLabel(log.action),
      description: [
        `资源：${targetLabel(log.target_type)}`,
        `活动：${
          log.activity_id
            ? activityMap.get(log.activity_id) || shortId(log.activity_id)
            : "-"
        }`,
        `操作者：${shortId(log.actor_id)}`,
        `目标：${shortId(log.target_id)}`,
      ].join(" · "),
      time: formatDate(log.created_at),
      tone: actionTone(log.action),
      badge: actionLabel(log.action),
    }));
  }, [activityMap, logs]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterByActivity = async (e: FormEvent<HTMLFormElement>) => {
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
    <section className="logs-page page-stack">
      <PageHeader
        eyebrow="Audit Logs"
        title="操作日志"
        description="查看系统关键操作记录，辅助审计活动、资源和任务流程。"
        actions={
          <button type="button" className="btn-secondary" onClick={loadAll}>
            刷新日志
          </button>
        }
      />

      <ApiError error={error} />

      <div className="logs-metric-grid">
        <StatCard
          label="日志总数"
          value={totalCount.toLocaleString("zh-CN")}
          description={mode === "activity" ? "当前活动筛选结果" : "全部操作记录"}
          icon="L"
          tone="cyan"
        />
        <StatCard
          label="最新记录时间"
          value={latestTime}
          description="按 created_at 字段统计"
          icon="N"
          tone="blue"
        />
        <StatCard
          label="活动数量"
          value={activities.length.toLocaleString("zh-CN")}
          description={`当前日志涉及 ${involvedActivityCount} 个活动`}
          icon="A"
          tone="green"
        />
        <StatCard
          label="操作类型"
          value={actionTypeCount.toLocaleString("zh-CN")}
          description="基于 action 字段去重"
          icon="T"
          tone="amber"
        />
      </div>

      <section className="logs-filter-panel">
        <form className="logs-filter-form" onSubmit={filterByActivity}>
          <label className="logs-field" htmlFor="activity-filter">
            <span>活动筛选</span>
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
          </label>

          <div className="logs-filter-actions">
            <button type="submit">按活动筛选</button>
            <button type="button" className="btn-secondary" onClick={loadAll}>
              查看全部
            </button>
          </div>
        </form>
      </section>

      <section className="logs-stream-panel">
        <div className="logs-section-heading">
          <div>
            <h2>审计事件流</h2>
            <p>按时间倒序展示后端关键业务操作。</p>
          </div>
          <StatusChip tone="info">{logs.length} 条记录</StatusChip>
        </div>

        {loading ? (
          <div className="loading">日志加载中...</div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon="L"
            title="暂无操作日志"
            description="系统产生操作记录后，会在这里显示审计事件。"
          />
        ) : (
          <div className="logs-layout">
            <div className="logs-timeline-wrap">
              <Timeline items={timelineItems} />
            </div>

            <div className="logs-detail-list">
              {logs.map((log) => (
                <ResourceCard
                  key={log.id}
                  title={actionLabel(log.action)}
                  description={log.summary || "无摘要"}
                  icon="L"
                  tone={
                    actionTone(log.action) === "danger"
                      ? "rose"
                      : actionTone(log.action) === "success"
                        ? "green"
                        : actionTone(log.action) === "warning"
                          ? "amber"
                          : "cyan"
                  }
                  meta={
                    <div className="logs-chip-row">
                      <StatusChip tone={actionTone(log.action)}>
                        {actionLabel(log.action)}
                      </StatusChip>
                      <span>{targetLabel(log.target_type)}</span>
                    </div>
                  }
                >
                  <div className="logs-event-grid">
                    <div>
                      <span>时间</span>
                      <strong>{formatDate(log.created_at)}</strong>
                    </div>
                    <div>
                      <span>活动</span>
                      <strong>
                        {log.activity_id
                          ? activityMap.get(log.activity_id) ||
                            shortId(log.activity_id)
                          : "-"}
                      </strong>
                    </div>
                    <div>
                      <span>操作者</span>
                      <strong>{shortId(log.actor_id)}</strong>
                    </div>
                    <div>
                      <span>目标 ID</span>
                      <strong>{shortId(log.target_id)}</strong>
                    </div>
                  </div>

                  <pre className="logs-metadata-block">
                    {formatMetadata(log.metadata)}
                  </pre>
                </ResourceCard>
              ))}
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
