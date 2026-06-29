import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { activitiesApi } from "../api/activities";
import { usersApi } from "../api/users";
import ApiError from "../components/ApiError";
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

import "../styles/activity-detail.css";

type Activity = {
  id: string;
  title: string;
  description?: string | null;
  activity_type?: string;
  college?: string | null;
  owner_id?: string;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type Task = {
  id: string;
  activity_id: string;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  creator_id?: string;
  priority?: string;
  due_time?: string | null;
  status: string;
  created_at?: string;
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

type ActivityMember = {
  activity_id: string;
  user_id: string;
  member_role: string;
  joined_at: string;
};

type User = {
  id: string;
  username: string;
  role: string;
  college?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function statusTone(status?: string): StatusTone {
  if (status === "completed" || status === "finished" || status === "returned") {
    return "success";
  }
  if (status === "cancelled" || status === "rejected" || status === "delayed") {
    return "danger";
  }
  if (status === "draft" || status === "pending") return "warning";
  if (status === "approved" || status === "in_progress" || status === "ongoing") {
    return "info";
  }
  return "neutral";
}

function statusLabel(status?: string) {
  const map: Record<string, string> = {
    draft: "草稿",
    pending: "待开始",
    approved: "已通过",
    in_progress: "进行中",
    ongoing: "进行中",
    delayed: "已延期",
    completed: "已完成",
    finished: "已结束",
    cancelled: "已取消",
    rejected: "已拒绝",
    returned: "已归还",
  };

  return map[status || ""] || status || "-";
}

function activityTypeLabel(type?: string) {
  const map: Record<string, string> = {
    general: "综合活动",
    course: "课程活动",
    meeting: "会议活动",
  };

  return map[type || ""] || type || "-";
}

function roleLabel(role?: string) {
  const map: Record<string, string> = {
    student: "学生",
    teacher: "教师",
    admin: "管理员",
  };

  return map[role || ""] || role || "-";
}

function roleTone(role?: string): StatusTone {
  if (role === "admin") return "admin";
  if (role === "teacher") return "teacher";
  if (role === "student") return "student";
  return "neutral";
}

function memberRoleLabel(role?: string) {
  const map: Record<string, string> = {
    owner: "负责人",
    member: "成员",
  };

  return map[role || ""] || role || "-";
}

function priorityLabel(priority?: string) {
  const map: Record<string, string> = {
    low: "低优先级",
    normal: "普通",
    medium: "中优先级",
    high: "高优先级",
    urgent: "紧急",
  };

  return map[priority || ""] || priority || "-";
}

function priorityTone(priority?: string): StatusTone {
  if (priority === "urgent" || priority === "high") return "danger";
  if (priority === "medium") return "warning";
  if (priority === "low") return "neutral";
  return "info";
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

function actionTone(action?: string): StatusTone {
  if (["approve", "checkout", "return", "completed"].includes(action || "")) {
    return "success";
  }
  if (["reject", "delete", "cancel", "remove_member"].includes(action || "")) {
    return "danger";
  }
  if (["update", "status_update"].includes(action || "")) return "warning";
  if (["create", "add_member", "apply", "add_progress"].includes(action || "")) {
    return "info";
  }
  return "neutral";
}

function formatMetadata(metadata: unknown) {
  if (!metadata) return "";

  if (typeof metadata === "string") {
    return metadata.trim();
  }

  if (typeof metadata === "object") {
    const entries = Object.entries(metadata as Record<string, unknown>);
    if (entries.length === 0) return "";

    return entries
      .slice(0, 3)
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

function taskProgressPercent(status?: string) {
  const map: Record<string, number> = {
    draft: 10,
    pending: 20,
    approved: 35,
    in_progress: 65,
    ongoing: 65,
    delayed: 45,
    completed: 100,
    finished: 100,
    cancelled: 0,
    rejected: 0,
  };

  return map[status || ""] ?? 20;
}

function taskTone(status?: string): VisualTone {
  const tone = statusTone(status);
  if (tone === "success") return "green";
  if (tone === "danger") return "rose";
  if (tone === "warning") return "amber";
  if (tone === "info") return "cyan";
  return "blue";
}

export default function ActivityDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [members, setMembers] = useState<ActivityMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [memberUserId, setMemberUserId] = useState("");
  const [error, setError] = useState("");
  const [pendingRemove, setPendingRemove] = useState("");
  const [loading, setLoading] = useState(true);

  const userMap = useMemo(() => {
    const map = new Map<string, User>();

    users.forEach((user) => {
      map.set(user.id, user);
    });

    return map;
  }, [users]);

  const taskRows = useMemo(() => {
    return tasks.map((task) => ({
      ...task,
      percent: taskProgressPercent(task.status),
    }));
  }, [tasks]);

  const overallProgress = useMemo(() => {
    if (tasks.length === 0) return 0;

    const total = taskRows.reduce((sum, task) => sum + task.percent, 0);
    return Math.round(total / tasks.length);
  }, [taskRows, tasks.length]);

  const completedTaskCount = tasks.filter(
    (task) => task.status === "completed" || task.status === "finished",
  ).length;

  const timelineItems = useMemo(() => {
    return logs.map((log) => {
      const actor = log.actor_id ? userMap.get(log.actor_id) : null;
      const metadata = formatMetadata(log.metadata);

      return {
        id: log.id,
        title: log.summary || actionLabel(log.action),
        description: [
          `${targetLabel(log.target_type)} / ${shortId(log.target_id)}`,
          actor ? `操作人：${actor.username}` : `操作人：${shortId(log.actor_id)}`,
          metadata,
        ]
          .filter(Boolean)
          .join(" · "),
        time: formatDate(log.created_at),
        tone: actionTone(log.action),
        badge: actionLabel(log.action),
      };
    });
  }, [logs, userMap]);

  const load = async () => {
    if (!id) return;

    setError("");
    setLoading(true);

    try {
      const [activityInfo, taskList, logList, memberList, userList] =
        await Promise.all([
          activitiesApi.get(id),
          activitiesApi.tasks(id),
          activitiesApi.logs(id),
          activitiesApi.listMembers(id),
          usersApi.list(),
        ]);

      const normalizedUsers = userList as User[];

      setActivity(activityInfo as Activity);
      setTasks(taskList as Task[]);
      setLogs(logList as OperationLog[]);
      setMembers(memberList as ActivityMember[]);
      setUsers(normalizedUsers);

      if (!memberUserId && normalizedUsers.length > 0) {
        setMemberUserId(normalizedUsers[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "活动详情加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addMember = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!memberUserId) return;

    try {
      await activitiesApi.addMember(id, {
        user_id: memberUserId,
        member_role: "member",
      });

      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "添加成员失败");
    }
  };

  const removeMember = async (userId: string) => {
    try {
      await activitiesApi.removeMember(id, userId);
      setPendingRemove("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "移除成员失败");
    }
  };

  if (loading && !activity) {
    return <div className="loading">活动详情加载中...</div>;
  }

  if (!activity) {
    return (
      <section className="activity-detail-page page-stack">
        <ApiError error={error || "活动不存在或加载失败"} />
      </section>
    );
  }

  return (
    <section className="activity-detail-page page-stack">
      <PageHeader
        eyebrow="Activity Detail"
        title={activity.title}
        description={`${activityTypeLabel(activity.activity_type)} · ${activity.college || "未填写学院 / 书院"} · ${statusLabel(activity.status)}`}
        meta={
          <StatusChip tone={statusTone(activity.status)}>
            {statusLabel(activity.status)}
          </StatusChip>
        }
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/activities")}
          >
            返回活动列表
          </button>
        }
      />

      <ApiError error={error} />

      <div className="activity-detail-metric-grid">
        <StatCard
          label="任务总数"
          value={tasks.length.toLocaleString("zh-CN")}
          description="当前活动下的任务分工"
          icon="T"
          tone="cyan"
        />
        <StatCard
          label="已完成任务"
          value={completedTaskCount.toLocaleString("zh-CN")}
          description="完成或结束状态的任务"
          icon="OK"
          tone="green"
        />
        <StatCard
          label="活动成员"
          value={members.length.toLocaleString("zh-CN")}
          description="负责人和参与成员"
          icon="M"
          tone="violet"
        />
        <StatCard
          label="操作记录"
          value={logs.length.toLocaleString("zh-CN")}
          description="活动相关审计日志"
          icon="L"
          tone="amber"
        />
      </div>

      <div className="activity-detail-layout">
        <div className="activity-detail-main">
          <section className="activity-detail-panel activity-detail-hero">
            <div>
              <div className="activity-detail-section-head">
                <div>
                  <h2>活动信息</h2>
                  <p>基础信息、时间和当前流转状态。</p>
                </div>
              </div>

              <p className="activity-detail-description">
                {activity.description || "暂无活动描述"}
              </p>
            </div>

            <div className="activity-detail-meta-grid">
              <div>
                <span>活动类型</span>
                <strong>{activityTypeLabel(activity.activity_type)}</strong>
              </div>
              <div>
                <span>学院 / 书院</span>
                <strong>{activity.college || "未填写"}</strong>
              </div>
              <div>
                <span>开始时间</span>
                <strong>{formatDate(activity.start_time)}</strong>
              </div>
              <div>
                <span>结束时间</span>
                <strong>{formatDate(activity.end_time)}</strong>
              </div>
              <div>
                <span>创建时间</span>
                <strong>{formatDate(activity.created_at)}</strong>
              </div>
              <div>
                <span>更新时间</span>
                <strong>{formatDate(activity.updated_at)}</strong>
              </div>
            </div>
          </section>

          <section className="activity-detail-panel">
            <div className="activity-detail-section-head">
              <div>
                <h2>任务分工</h2>
                <p>按任务状态展示负责人、优先级、截止时间和进度。</p>
              </div>
              <StatusChip tone="info">{tasks.length} 项</StatusChip>
            </div>

            {taskRows.length === 0 ? (
              <EmptyState
                icon="T"
                title="暂无任务分工"
                description="创建任务后，它会以卡片形式显示在这里。"
              />
            ) : (
              <div className="activity-task-grid">
                {taskRows.map((task) => {
                  const assignee = task.assignee_id
                    ? userMap.get(task.assignee_id)
                    : null;

                  return (
                    <ResourceCard
                      key={task.id}
                      title={task.title}
                      description={task.description || "暂无任务描述"}
                      icon="T"
                      tone={taskTone(task.status)}
                      meta={
                        <div className="activity-detail-chip-row">
                          <StatusChip tone={statusTone(task.status)}>
                            {statusLabel(task.status)}
                          </StatusChip>
                          <StatusChip tone={priorityTone(task.priority)}>
                            {priorityLabel(task.priority)}
                          </StatusChip>
                        </div>
                      }
                    >
                      <div className="activity-task-card-body">
                        <div>
                          <span>负责人</span>
                          <strong>{assignee?.username || "未分配"}</strong>
                        </div>
                        <div>
                          <span>截止时间</span>
                          <strong>{formatDate(task.due_time)}</strong>
                        </div>
                      </div>

                      <div className="activity-progress-track">
                        <div style={{ width: `${task.percent}%` }} />
                      </div>
                      <div className="activity-progress-caption">
                        进度 {task.percent}%
                      </div>
                    </ResourceCard>
                  );
                })}
              </div>
            )}
          </section>

          <section className="activity-detail-panel">
            <div className="activity-detail-section-head">
              <div>
                <h2>操作日志</h2>
                <p>活动相关操作以时间线展示，便于追踪流程变化。</p>
              </div>
              <StatusChip tone="info">{logs.length} 条</StatusChip>
            </div>

            {timelineItems.length === 0 ? (
              <EmptyState
                icon="L"
                title="暂无进度记录"
                description="成员、任务、场地或设备操作会在这里生成记录。"
              />
            ) : (
              <Timeline items={timelineItems} />
            )}
          </section>
        </div>

        <aside className="activity-detail-side">
          <section className="activity-detail-panel activity-progress-panel">
            <ProgressRing
              value={completedTaskCount}
              max={tasks.length}
              label={`${overallProgress}%`}
              caption="任务进度"
              tone={overallProgress >= 75 ? "green" : "amber"}
              size={148}
            />
            <div>
              <h2>整体进度</h2>
              <p>
                已完成 {completedTaskCount} / 总计 {tasks.length} 项任务。
              </p>
            </div>
          </section>

          <section className="activity-detail-panel">
            <div className="activity-detail-section-head">
              <div>
                <h2>成员管理</h2>
                <p>添加或移除活动成员，负责人不可直接移除。</p>
              </div>
            </div>

            <form className="activity-member-form" onSubmit={addMember}>
              <select
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}（{roleLabel(user.role)}） {user.college || "未填写"}
                  </option>
                ))}
              </select>

              <button type="submit">添加成员</button>
            </form>

            {members.length === 0 ? (
              <EmptyState
                icon="M"
                title="暂无成员"
                description="添加成员后会显示成员身份和加入时间。"
              />
            ) : (
              <div className="activity-member-list">
                {members.map((member) => {
                  const user = userMap.get(member.user_id);

                  return (
                    <article
                      className="activity-member-card"
                      key={`${member.activity_id}-${member.user_id}`}
                    >
                      <div>
                        <strong>{user?.username || shortId(member.user_id)}</strong>
                        <span>{user?.college || "未填写学院 / 书院"}</span>
                      </div>

                      <div className="activity-detail-chip-row">
                        <StatusChip tone={roleTone(user?.role)}>
                          {roleLabel(user?.role)}
                        </StatusChip>
                        <StatusChip
                          tone={member.member_role === "owner" ? "admin" : "neutral"}
                        >
                          {memberRoleLabel(member.member_role)}
                        </StatusChip>
                      </div>

                      <small>加入时间：{formatDate(member.joined_at)}</small>

                      {member.member_role === "owner" ? null : (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => setPendingRemove(member.user_id)}
                        >
                          移除
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="activity-detail-panel">
            <div className="activity-detail-section-head">
              <div>
                <h2>关联资源</h2>
                <p>当前详情页未加载场地和设备列表，先保留为空状态。</p>
              </div>
            </div>

            <div className="activity-resource-empty-grid">
              <EmptyState
                icon="V"
                title="暂无场地预约"
                description="当前页面没有可展示的场地预约数据。"
              />
              <EmptyState
                icon="D"
                title="暂无设备借用"
                description="当前页面没有可展示的设备借用数据。"
              />
            </div>
          </section>
        </aside>
      </div>

      {pendingRemove ? (
        <div className="modal-mask">
          <div className="modal-card activity-detail-modal-card">
            <h3>确认移除成员</h3>
            <p>确认移除该成员吗？该操作会写入操作日志。</p>

            <div className="btn-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPendingRemove("")}
              >
                取消
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={() => void removeMember(pendingRemove)}
              >
                确认移除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
