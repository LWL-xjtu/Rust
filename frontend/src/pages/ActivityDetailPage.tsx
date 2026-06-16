import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";

import { activitiesApi } from "../api/activities";
import { usersApi } from "../api/users";
import ApiError from "../components/ApiError";
import { zhAction, zhRole, zhStatus } from "../utils/display";

import "../styles/log-tables.css";

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

function taskProgressClass(status?: string) {
  if (status === "completed" || status === "finished") {
    return "task-progress-fill task-progress-fill-done";
  }

  if (status === "delayed") {
    return "task-progress-fill task-progress-fill-warning";
  }

  if (status === "cancelled" || status === "rejected") {
    return "task-progress-fill task-progress-fill-danger";
  }

  return "task-progress-fill";
}

export default function ActivityDetailPage() {
  const { id = "" } = useParams();

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
      <div className="page-header">
        <div>
          <p className="page-eyebrow">ACTIVITY DETAIL</p>
          <h1>活动详情</h1>
          <p className="page-description">
            查看活动信息、成员管理、任务进度和后端操作日志。
          </p>
        </div>

        <span className={`status status-${activity.status}`}>
          {zhStatus(activity.status)}
        </span>
      </div>

      <ApiError error={error} />

      <div className="panel activity-info-panel">
        <div className="activity-info-main">
          <div>
            <span className="activity-info-label">活动标题</span>
            <h2>{activity.title}</h2>
          </div>

          <p>{activity.description || "暂无活动描述"}</p>
        </div>

        <div className="activity-meta-grid">
          <div>
            <span>活动类型</span>
            <strong>{activity.activity_type || "-"}</strong>
          </div>

          <div>
            <span>所属学院</span>
            <strong>{activity.college || "-"}</strong>
          </div>

          <div>
            <span>开始时间</span>
            <strong>{formatDate(activity.start_time)}</strong>
          </div>

          <div>
            <span>结束时间</span>
            <strong>{formatDate(activity.end_time)}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="console-section-header">
          <div>
            <h2>成员管理</h2>
            <p>添加或移除活动成员，活动 owner 不可直接移除。</p>
          </div>
        </div>

        <form className="member-form" onSubmit={addMember}>
          <select
            value={memberUserId}
            onChange={(e) => setMemberUserId(e.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}（{zhRole(user.role)}）- {user.college || "未填写"}
              </option>
            ))}
          </select>

          <button type="submit">添加成员</button>
        </form>

        <div className="console-table-wrap">
          <table className="console-table member-table">
            <thead>
              <tr>
                <th>成员</th>
                <th>角色</th>
                <th>加入时间</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {members.map((member) => {
                const user = userMap.get(member.user_id);

                return (
                  <tr key={`${member.activity_id}-${member.user_id}`}>
                    <td>
                      {user
                        ? `${user.username}（${shortId(member.user_id)}）`
                        : shortId(member.user_id)}
                    </td>
                    <td>{member.member_role}</td>
                    <td className="console-time-cell">
                      {formatDate(member.joined_at)}
                    </td>
                    <td>
                      {member.member_role === "owner" ? (
                        "-"
                      ) : (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => setPendingRemove(member.user_id)}
                        >
                          移除
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel task-progress-panel">
        <div className="console-section-header">
          <div>
            <h2>任务进度</h2>
            <p>原“任务摘要”已改为进度条形式，按任务状态自动计算进度。</p>
          </div>

          <span className="console-table-count">
            {completedTaskCount}/{tasks.length} 已完成
          </span>
        </div>

        <div className="task-progress-overview">
          <div>
            <span>整体进度</span>
            <strong>{overallProgress}%</strong>
          </div>

          <div className="task-progress-track task-progress-track-large">
            <div
              className="task-progress-fill task-progress-fill-done"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {taskRows.length === 0 ? (
          <div className="console-empty">
            <div>✅</div>
            <strong>暂无任务</strong>
            <p>创建任务后，这里会显示每个任务的进度条。</p>
          </div>
        ) : (
          <div className="task-progress-list">
            {taskRows.map((task) => {
              const assignee = task.assignee_id
                ? userMap.get(task.assignee_id)
                : null;

              return (
                <div className="task-progress-row" key={task.id}>
                  <div className="task-progress-top">
                    <div>
                      <strong>{task.title}</strong>
                      <span>
                        {assignee ? `负责人：${assignee.username}` : "负责人：未分配"}
                      </span>
                    </div>

                    <span className={`status status-${task.status}`}>
                      {zhStatus(task.status)}
                    </span>
                  </div>

                  <div className="task-progress-track">
                    <div
                      className={taskProgressClass(task.status)}
                      style={{ width: `${task.percent}%` }}
                    />
                  </div>

                  <div className="task-progress-bottom">
                    <span>进度 {task.percent}%</span>
                    <span>截止时间：{formatDate(task.due_time)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel console-log-panel">
        <div className="console-section-header">
          <div>
            <h2>操作日志</h2>
            <p>活动详情页操作日志已改为表格形式，便于查看审计记录。</p>
          </div>

          <span className="console-table-count">{logs.length} 条</span>
        </div>

        {logs.length === 0 ? (
          <div className="console-empty">
            <div>🧾</div>
            <strong>暂无操作日志</strong>
            <p>成员、任务、场地和设备操作会在这里生成记录。</p>
          </div>
        ) : (
          <div className="console-table-wrap">
            <table className="console-table activity-log-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作</th>
                  <th>资源类型</th>
                  <th>操作者</th>
                  <th>目标 ID</th>
                  <th>摘要</th>
                  <th>详细参数</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
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
                    <td className="console-id-cell">{shortId(log.actor_id)}</td>
                    <td className="console-id-cell">{shortId(log.target_id)}</td>
                    <td className="console-summary-cell">{log.summary || "-"}</td>
                    <td className="console-metadata-cell">
                      {formatMetadata(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingRemove ? (
        <div className="modal-mask">
          <div className="modal-card">
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
