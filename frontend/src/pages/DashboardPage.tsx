import { useEffect, useMemo, useState } from "react";

import { authApi } from "../api/auth";
import { logsApi } from "../api/logs";
import { statsApi } from "../api/stats";
import type { User } from "../api/types";
import ApiError from "../components/ApiError";
import Loading from "../components/Loading";
import {
  EmptyState,
  PageHeader,
  ProgressRing,
  ResourceCard,
  StatCard,
  StatusChip,
  Timeline,
  type StatusTone,
  type VisualTone,
} from "../components/ui";

import "../styles/dashboard.css";

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

type MetricConfig = {
  key: keyof Overview;
  label: string;
  description: string;
  icon: string;
  tone: VisualTone;
  adminOnly?: boolean;
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

function actionLabel(action?: string) {
  const map: Record<string, string> = {
    create: "创建",
    update: "修改",
    delete: "删除",
    add_member: "添加成员",
    remove_member: "移除成员",
    status_update: "更新状态",
    add_progress: "添加进度",
    approve: "通过",
    reject: "拒绝",
    cancel: "取消",
    apply: "发起申请",
    checkout: "确认借出",
    return: "确认归还",
    completed: "完成",
  };

  return map[action || ""] || action || "-";
}

function roleLabel(role?: string) {
  const map: Record<string, string> = {
    student: "学生",
    teacher: "教师",
    admin: "管理员",
  };

  return map[role || ""] || role || "-";
}

function actionTone(action?: string): StatusTone {
  if (!action) return "neutral";

  if (["create", "add_member", "apply", "add_progress"].includes(action)) {
    return "info";
  }

  if (["approve", "checkout", "return", "completed"].includes(action)) {
    return "success";
  }

  if (["reject", "delete", "cancel", "remove_member"].includes(action)) {
    return "danger";
  }

  if (["update", "status_update"].includes(action)) {
    return "warning";
  }

  return "neutral";
}

function roleTone(role?: string): StatusTone {
  if (role === "admin") return "admin";
  if (role === "teacher") return "teacher";
  if (role === "student") return "student";
  return "neutral";
}

function percent(done?: number, total?: number) {
  if (!total || total <= 0) return 0;
  return Math.round(((done || 0) / total) * 100);
}

function displayNumber(value?: number) {
  return typeof value === "number" ? value.toLocaleString("zh-CN") : "-";
}

const adminMetricCards: MetricConfig[] = [
  {
    key: "activities_count",
    label: "活动总数",
    description: "全部校园活动",
    icon: "A",
    tone: "cyan",
  },
  {
    key: "venue_bookings_count",
    label: "场地预约",
    description: "场地申请与审批",
    icon: "V",
    tone: "blue",
  },
  {
    key: "device_borrows_count",
    label: "设备借用",
    description: "设备借用记录",
    icon: "D",
    tone: "violet",
  },
  {
    key: "tasks_count",
    label: "任务总数",
    description: "活动任务数量",
    icon: "T",
    tone: "amber",
  },
  {
    key: "tasks_done_count",
    label: "已完成任务",
    description: "完成进度统计",
    icon: "OK",
    tone: "green",
  },
  {
    key: "users_count",
    label: "用户总数",
    description: "系统成员数量",
    icon: "U",
    tone: "rose",
    adminOnly: true,
  },
];

const studentResources = [
  {
    title: "活动",
    description: "查看和参与校园活动",
    meta: "Activities",
    icon: "A",
    tone: "cyan" as VisualTone,
  },
  {
    title: "场地",
    description: "查看和申请场地预约",
    meta: "Venues",
    icon: "V",
    tone: "blue" as VisualTone,
  },
  {
    title: "设备",
    description: "查看和申请设备借用",
    meta: "Devices",
    icon: "D",
    tone: "violet" as VisualTone,
  },
  {
    title: "任务",
    description: "查看和处理分配任务",
    meta: "Tasks",
    icon: "T",
    tone: "green" as VisualTone,
  },
];

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

  const taskCompletion = percent(
    overview?.tasks_done_count,
    overview?.tasks_count,
  );

  const timelineItems = useMemo(() => {
    return recentLogs.map((log) => ({
      id: log.id,
      title: log.summary || "操作记录",
      description: `${targetLabel(log.target_type)} / ${shortId(log.target_id)}`,
      time: formatDate(log.created_at),
      tone: actionTone(log.action),
      badge: actionLabel(log.action),
      meta: (
        <span className="dashboard-timeline-meta">
          {targetLabel(log.target_type)}
        </span>
      ),
    }));
  }, [recentLogs]);

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
      <PageHeader
        eyebrow="Dashboard"
        title="仪表盘"
        description={`当前用户：${me?.username || "-"}，角色：${roleLabel(me?.role)}。`}
        meta={<StatusChip tone={roleTone(me?.role)}>{roleLabel(me?.role)}</StatusChip>}
      />

      <ApiError error={error} />

      {canViewAdminInfo ? (
        <>
          <div className="dashboard-hero">
            <div className="dashboard-hero-main">
              <div className="dashboard-hero-copy">
                <div>
                  <p className="dashboard-hero-kicker">Campus Operations</p>
                  <h2 className="dashboard-hero-title">
                    活动、资源与任务运行概览
                  </h2>
                  <p className="dashboard-hero-description">
                    汇总活动、场地、设备和任务数据，帮助教师与管理员快速判断当前运营状态。
                  </p>
                </div>

                <div className="dashboard-hero-facts">
                  <div className="dashboard-hero-fact">
                    <span>活动</span>
                    <strong>{displayNumber(overview?.activities_count)}</strong>
                  </div>
                  <div className="dashboard-hero-fact">
                    <span>任务完成率</span>
                    <strong>{taskCompletion}%</strong>
                  </div>
                  <div className="dashboard-hero-fact">
                    <span>最近日志</span>
                    <strong>{recentLogs.length}</strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-hero-map" aria-hidden="true">
                <span className="dashboard-hero-line" />
              </div>
            </div>

            <div className="dashboard-hero-progress">
              <ProgressRing
                value={overview?.tasks_done_count || 0}
                max={overview?.tasks_count || 0}
                label={`${taskCompletion}%`}
                caption="任务完成"
                tone={taskCompletion >= 75 ? "green" : "amber"}
                size={142}
              />
              <div className="dashboard-progress-copy">
                <h2>任务进度</h2>
                <p>
                  已完成 {displayNumber(overview?.tasks_done_count)} / 总计{" "}
                  {displayNumber(overview?.tasks_count)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="dashboard-section-title">
              <div>
                <h2>关键指标</h2>
                <p>来自统计接口的实时汇总数据</p>
              </div>
            </div>

            <div className="dashboard-metric-grid">
              {adminMetricCards
                .filter((card) => !card.adminOnly || me?.role === "admin")
                .map((card) => (
                  <StatCard
                    key={card.key}
                    label={card.label}
                    value={displayNumber(overview?.[card.key])}
                    description={card.description}
                    icon={card.icon}
                    tone={card.tone}
                  />
                ))}
            </div>
          </div>
        </>
      ) : (
        <div>
          <div className="dashboard-section-title">
            <div>
              <h2>可用功能</h2>
              <p>学生账号可使用的核心流程</p>
            </div>
          </div>

          <div className="dashboard-resource-grid">
            {studentResources.map((resource) => (
              <ResourceCard
                key={resource.title}
                title={resource.title}
                description={resource.description}
                meta={resource.meta}
                icon={resource.icon}
                tone={resource.tone}
                footer={<StatusChip tone="student">可访问</StatusChip>}
              />
            ))}
          </div>
        </div>
      )}

      {canViewAdminInfo ? (
        <div className="dashboard-timeline-panel">
          <div className="dashboard-section-title">
            <div>
              <h2>最近操作日志</h2>
              <p>仅教师 / 管理员可见，学生账号不会显示该模块。</p>
            </div>

            <StatusChip tone="info">{recentLogs.length} 条</StatusChip>
          </div>

          {recentLogs.length === 0 ? (
            <EmptyState
              icon="L"
              title="暂无最近操作日志"
              description="完成活动、任务、场地或设备操作后，这里会显示记录。"
            />
          ) : (
            <Timeline items={timelineItems} />
          )}
        </div>
      ) : null}
    </section>
  );
}
