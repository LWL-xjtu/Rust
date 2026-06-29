import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { activitiesApi } from "../api/activities";
import ApiError from "../components/ApiError";
import {
  EmptyState,
  PageHeader,
  ResourceCard,
  StatCard,
  StatusChip,
  type StatusTone,
  type VisualTone,
} from "../components/ui";
import { COLLEGE_OPTIONS } from "../utils/display";

import "../styles/activities.css";

type Activity = {
  id: string;
  title: string;
  description?: string | null;
  activity_type?: string;
  college?: string | null;
  owner_id?: string;
  start_time?: string | null;
  end_time?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type ActivityForm = {
  title: string;
  description: string;
  activity_type: string;
  college: string;
  customCollege: string;
};

const defaultCollege = COLLEGE_OPTIONS[0] || "";

const initialForm: ActivityForm = {
  title: "",
  description: "",
  activity_type: "general",
  college: defaultCollege,
  customCollege: "",
};

function statusTone(status?: string): StatusTone {
  if (status === "completed" || status === "finished") return "success";
  if (status === "cancelled" || status === "rejected" || status === "deleted") {
    return "danger";
  }
  if (status === "draft" || status === "pending") return "warning";
  if (status === "in_progress" || status === "ongoing" || status === "approved") {
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
    completed: "已完成",
    finished: "已结束",
    cancelled: "已取消",
    rejected: "已拒绝",
    deleted: "已删除",
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

function summary(value?: string | null) {
  const text = value?.trim();
  if (!text) return "暂无活动描述";
  if (text.length <= 72) return text;
  return `${text.slice(0, 72)}...`;
}

function metricCount(items: Activity[], predicate: (item: Activity) => boolean) {
  return items.filter(predicate).length.toLocaleString("zh-CN");
}

function cardTone(activity: Activity): VisualTone {
  const tone = statusTone(activity.status);
  if (tone === "success") return "green";
  if (tone === "danger") return "rose";
  if (tone === "warning") return "amber";
  if (tone === "info") return "cyan";
  return "blue";
}

export default function ActivitiesPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<ActivityForm>(initialForm);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const nav = useNavigate();

  const metrics = useMemo(
    () => ({
      total: items.length.toLocaleString("zh-CN"),
      drafts: metricCount(items, (item) => item.status === "draft"),
      active: metricCount(items, (item) =>
        ["approved", "in_progress", "ongoing"].includes(item.status || ""),
      ),
      completed: metricCount(items, (item) =>
        ["completed", "finished"].includes(item.status || ""),
      ),
    }),
    [items],
  );

  const load = async () => {
    setLoading(true);
    try {
      setItems((await activitiesApi.list()) as Activity[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submitCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
    setError("");
    setSuccess("");

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
    setError("");
    setSuccess("");

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
    <section className="activities-page page-stack">
      <PageHeader
        eyebrow="Activities"
        title="活动管理"
        description="创建、编辑并管理校园活动流程。"
        actions={<StatusChip tone="info">{metrics.total} 个活动</StatusChip>}
      />

      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}

      <div className="activities-metric-grid">
        <StatCard
          label="活动总数"
          value={metrics.total}
          description="当前可见的校园活动"
          icon="A"
          tone="cyan"
        />
        <StatCard
          label="草稿"
          value={metrics.drafts}
          description="尚未推进的活动"
          icon="D"
          tone="amber"
        />
        <StatCard
          label="已发布 / 进行中"
          value={metrics.active}
          description="正在流转的活动"
          icon="P"
          tone="blue"
        />
        <StatCard
          label="已完成"
          value={metrics.completed}
          description="已结束的活动"
          icon="OK"
          tone="green"
        />
      </div>

      <div className="activities-create-panel">
        <div className="activities-section-heading">
          <div>
            <h2>创建活动</h2>
            <p>填写基础信息后，活动会以草稿状态创建。</p>
          </div>
        </div>

        <form className="activities-form" onSubmit={submitCreate}>
          <label className="activities-field activities-field-wide">
            <span>活动标题</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="请输入活动标题"
              required
            />
          </label>

          <label className="activities-field activities-field-wide">
            <span>活动描述</span>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="请输入活动描述"
            />
          </label>

          <label className="activities-field">
            <span>活动类型</span>
            <select
              value={form.activity_type}
              onChange={(e) =>
                setForm({ ...form, activity_type: e.target.value })
              }
            >
              <option value="general">综合活动</option>
              <option value="course">课程活动</option>
              <option value="meeting">会议活动</option>
            </select>
          </label>

          <label className="activities-field">
            <span>学院 / 书院</span>
            <select
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
            >
              {COLLEGE_OPTIONS.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </label>

          {form.college === "其他" ? (
            <label className="activities-field">
              <span>自定义学院 / 书院</span>
              <input
                value={form.customCollege}
                onChange={(e) =>
                  setForm({ ...form, customCollege: e.target.value })
                }
                placeholder="请输入学院 / 书院"
              />
            </label>
          ) : null}

          <div className="activities-form-actions">
            <button type="submit">创建活动</button>
          </div>
        </form>
      </div>

      <div className="activities-list-panel">
        <div className="activities-section-heading">
          <div>
            <h2>活动列表</h2>
            <p>以卡片方式浏览活动，并继续使用原来的详情、编辑、删除操作。</p>
          </div>

          {loading ? <StatusChip tone="info">加载中</StatusChip> : null}
        </div>

        {items.length === 0 && !loading ? (
          <EmptyState
            icon="A"
            title="还没有活动"
            description="创建第一个校园活动后，它会显示在这里。"
          />
        ) : (
          <div className="activities-card-grid">
            {items.map((activity) => (
              <ResourceCard
                key={activity.id}
                title={activity.title}
                description={summary(activity.description)}
                icon={activityTypeLabel(activity.activity_type).slice(0, 1)}
                tone={cardTone(activity)}
                meta={
                  <div className="activities-card-meta">
                    <StatusChip tone={statusTone(activity.status)}>
                      {statusLabel(activity.status)}
                    </StatusChip>
                    <span>{activityTypeLabel(activity.activity_type)}</span>
                  </div>
                }
                footer={
                  <div className="activities-card-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => nav(`/activities/${activity.id}`)}
                    >
                      详情
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditing({ ...activity })}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setDeleting(activity)}
                    >
                      删除
                    </button>
                  </div>
                }
              >
                <div className="activities-card-details">
                  <div>
                    <span>学院 / 书院</span>
                    <strong>{activity.college || "未填写"}</strong>
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
              </ResourceCard>
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <div className="modal-mask">
          <div className="modal-card activities-modal-card">
            <h3>编辑活动</h3>

            <label className="activities-field">
              <span>活动标题</span>
              <input
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                placeholder="活动标题"
              />
            </label>

            <label className="activities-field">
              <span>活动描述</span>
              <input
                value={editing.description || ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                placeholder="活动描述"
              />
            </label>

            <label className="activities-field">
              <span>学院 / 书院</span>
              <input
                value={editing.college || ""}
                onChange={(e) =>
                  setEditing({ ...editing, college: e.target.value })
                }
                placeholder="学院 / 书院"
              />
            </label>

            <div className="activities-edit-summary">
              <span>活动类型：{activityTypeLabel(editing.activity_type)}</span>
              <StatusChip tone={statusTone(editing.status)}>
                {statusLabel(editing.status)}
              </StatusChip>
            </div>

            <div className="btn-row">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-secondary"
              >
                取消
              </button>
              <button type="button" onClick={saveEdit}>
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleting ? (
        <div className="modal-mask">
          <div className="modal-card activities-modal-card">
            <h3>确认删除</h3>
            <p>
              确定删除活动「{deleting.title}」吗？该操作会沿用原来的删除接口。
            </p>

            <div className="btn-row">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="btn-secondary"
              >
                取消
              </button>
              <button type="button" onClick={doDelete} className="btn-danger">
                确认删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
