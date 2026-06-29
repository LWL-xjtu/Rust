import { useEffect, useMemo, useState, type FormEvent } from "react";

import { activitiesApi } from "../api/activities";
import { venuesApi } from "../api/venues";
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

import "../styles/venues.css";

type Venue = {
  id: string;
  name: string;
  venue_type?: string;
  capacity?: number;
  location?: string;
  note?: string | null;
  status?: string;
};

type Booking = {
  id: string;
  activity_id: string;
  venue_id: string;
  applicant_id?: string;
  activity_name?: string | null;
  venue_name?: string | null;
  applicant_name?: string | null;
  approver_id?: string | null;
  start_time?: string;
  end_time?: string;
  status?: string;
  reason?: string | null;
  created_at?: string;
};

type Activity = {
  id: string;
  title: string;
};

type VenueForm = {
  name: string;
  venue_type: string;
  capacity: number;
  location: string;
  note: string;
  status: string;
};

const CAMPUS_LOCATIONS = [
  "创新港-泓理楼东区-1层",
  "创新港-泓理楼东区-2层",
  "创新港-涵英楼报告厅",
  "兴庆校区-主楼B座101",
  "兴庆校区-图书馆一层研讨室",
  "雁塔校区-教学楼2号楼201",
  "雁塔校区-体育馆多功能厅",
  "曲江校区-工程训练中心",
  "钱学森书院活动中心",
  "仲英书院共享讨论区",
  "其他（手动填写）",
];

const initialVenueForm: VenueForm = {
  name: "",
  venue_type: "实验室",
  capacity: 50,
  location: "",
  note: "",
  status: "available",
};

function statusTone(status?: string): StatusTone {
  if (status === "available" || status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected" || status === "unavailable") return "danger";
  if (status === "cancelled" || status === "maintenance") return "neutral";
  return "info";
}

function statusLabel(status?: string) {
  const map: Record<string, string> = {
    available: "可预约",
    maintenance: "维护中",
    unavailable: "不可预约",
    pending: "待审批",
    approved: "已通过",
    rejected: "已拒绝",
    cancelled: "已取消",
  };

  return map[status || ""] || status || "-";
}

function venueTone(status?: string): VisualTone {
  const tone = statusTone(status);
  if (tone === "success") return "green";
  if (tone === "danger") return "rose";
  if (tone === "warning") return "amber";
  return "cyan";
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
  if (!text) return "暂无说明";
  if (text.length <= 72) return text;
  return `${text.slice(0, 72)}...`;
}

function buildVenuePayload(venue: Venue) {
  return {
    name: venue.name,
    venue_type: venue.venue_type,
    location: venue.location,
    capacity: venue.capacity,
    note: venue.note || null,
    status: venue.status,
  };
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [locationPreset, setLocationPreset] = useState(CAMPUS_LOCATIONS[0]);
  const [locationDetail, setLocationDetail] = useState("");
  const [editing, setEditing] = useState<Venue | null>(null);
  const [deleting, setDeleting] = useState<Venue | null>(null);

  const [venueForm, setVenueForm] = useState<VenueForm>(initialVenueForm);

  const [bookingForm, setBookingForm] = useState({
    activity_id: "",
    venue_id: "",
    start_time: "",
    end_time: "",
    reason: "",
  });

  const venueOptions = useMemo(() => {
    const seen = new Set<string>();
    const unique: Venue[] = [];

    for (const venue of venues) {
      if (venue.status && venue.status !== "available") continue;

      const key = `${(venue.name || "").trim().toLowerCase()}|${(venue.location || "").trim().toLowerCase()}`;
      if (!key || seen.has(key)) continue;

      seen.add(key);
      unique.push(venue);
    }

    return unique;
  }, [venues]);

  const metrics = useMemo(
    () => ({
      total: venues.length,
      available: venues.filter((venue) => venue.status === "available").length,
      bookings: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      approved: bookings.filter((booking) => booking.status === "approved").length,
      rejected: bookings.filter((booking) => booking.status === "rejected").length,
    }),
    [bookings, venues],
  );

  const load = async () => {
    try {
      setError("");
      const [venueList, bookingList, activityList] = await Promise.all([
        venuesApi.listVenues(),
        venuesApi.listBookings(),
        activitiesApi.list(),
      ]);

      setVenues(venueList as Venue[]);
      setBookings(bookingList as Booking[]);
      setActivities(activityList as Activity[]);
      setBookingForm((state) => ({
        ...state,
        activity_id: state.activity_id || activityList[0]?.id || "",
        venue_id: state.venue_id || venueList[0]?.id || "",
      }));
    } catch (err: any) {
      setError(err.message || "加载失败，请稍后重试");
    }
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    setBookingForm((form) => ({
      ...form,
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
    }));

    void load();
  }, []);

  useEffect(() => {
    if (!bookingForm.venue_id && venueOptions.length > 0) {
      setBookingForm((prev) => ({ ...prev, venue_id: venueOptions[0].id }));
    }
  }, [venueOptions, bookingForm.venue_id]);

  const buildLocation = () => {
    const detail = locationDetail.trim();

    if (locationPreset === "其他（手动填写）") {
      return detail;
    }

    return detail ? `${locationPreset} / ${detail}` : locationPreset;
  };

  const createVenue = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const finalLocation = buildLocation();

    if (!finalLocation) {
      setError("请填写场地位置");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await venuesApi.createVenue({ ...venueForm, location: finalLocation });
      setSuccess("场地新增成功");
      setVenueForm((venue) => ({ ...venue, name: "", note: "" }));
      setLocationDetail("");
      await load();
    } catch (err: any) {
      setError(err.message || "场地新增失败");
    }
  };

  const saveVenue = async () => {
    if (!editing) return;

    try {
      setError("");
      setSuccess("");
      await venuesApi.updateVenue(editing.id, buildVenuePayload(editing));
      setEditing(null);
      setSuccess("场地已更新");
      await load();
    } catch (err: any) {
      setError(err.message || "场地更新失败");
    }
  };

  const deleteVenue = async () => {
    if (!deleting) return;

    try {
      setError("");
      setSuccess("");
      await venuesApi.deleteVenue(deleting.id);
      setDeleting(null);
      setSuccess("场地已删除");
      await load();
    } catch (err: any) {
      setError(err.message || "场地删除失败");
    }
  };

  const createBooking = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");
      await venuesApi.createBooking({
        ...bookingForm,
        start_time: new Date(bookingForm.start_time).toISOString(),
        end_time: new Date(bookingForm.end_time).toISOString(),
      });
      setSuccess("预约申请已提交");
      await load();
    } catch (err: any) {
      setError(err.message || "预约申请失败");
    }
  };

  const act = async (fn: () => Promise<any>, msg: string) => {
    try {
      setError("");
      setSuccess("");
      await fn();
      setSuccess(msg);
      await load();
    } catch (err: any) {
      setError(err.message || "操作失败");
    }
  };

  return (
    <section className="venues-page page-stack">
      <PageHeader
        eyebrow="Venues"
        title="场地预约"
        description="管理校园场地资源，提交和跟踪预约申请。"
        actions={<StatusChip tone="info">{metrics.total} 个场地</StatusChip>}
      />

      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}

      <div className="venues-metric-grid">
        <StatCard
          label="场地总数"
          value={metrics.total.toLocaleString("zh-CN")}
          description="当前登记的场地资源"
          icon="V"
          tone="cyan"
        />
        <StatCard
          label="可预约场地"
          value={metrics.available.toLocaleString("zh-CN")}
          description="状态为可预约的场地"
          icon="A"
          tone="green"
        />
        <StatCard
          label="预约申请"
          value={metrics.bookings.toLocaleString("zh-CN")}
          description="当前可见预约记录"
          icon="B"
          tone="blue"
        />
        <StatCard
          label="待审批"
          value={metrics.pending.toLocaleString("zh-CN")}
          description={`已通过 ${metrics.approved} / 已拒绝 ${metrics.rejected}`}
          icon="P"
          tone="amber"
        />
      </div>

      <section className="venues-create-panel">
        <div className="venues-section-heading">
          <div>
            <h2>新增场地</h2>
            <p>登记场地基础信息，并设置当前是否可预约。</p>
          </div>
        </div>

        <form className="venues-form" onSubmit={createVenue}>
          <label className="venues-field">
            <span>场地名称</span>
            <input
              value={venueForm.name}
              onChange={(e) =>
                setVenueForm({ ...venueForm, name: e.target.value })
              }
              placeholder="请输入场地名称"
              required
            />
          </label>

          <label className="venues-field">
            <span>场地类型</span>
            <select
              value={venueForm.venue_type}
              onChange={(e) =>
                setVenueForm({ ...venueForm, venue_type: e.target.value })
              }
            >
              <option>实验室</option>
              <option>会议室</option>
              <option>讨论室</option>
              <option>自习室</option>
              <option>活动室</option>
              <option>体育场地</option>
            </select>
          </label>

          <label className="venues-field">
            <span>容量</span>
            <input
              type="number"
              min={1}
              value={venueForm.capacity}
              onChange={(e) =>
                setVenueForm({
                  ...venueForm,
                  capacity: Number(e.target.value),
                })
              }
              placeholder="容纳人数"
            />
          </label>

          <label className="venues-field">
            <span>位置</span>
            <select
              value={locationPreset}
              onChange={(e) => setLocationPreset(e.target.value)}
            >
              {CAMPUS_LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label className="venues-field">
            <span>门牌 / 房间</span>
            <input
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              placeholder={
                locationPreset === "其他（手动填写）"
                  ? "请输入完整位置"
                  : "补充房间 / 门牌，例如：西一楼 107"
              }
              required={locationPreset === "其他（手动填写）"}
            />
          </label>

          <label className="venues-field venues-field-wide">
            <span>说明</span>
            <input
              value={venueForm.note}
              onChange={(e) =>
                setVenueForm({ ...venueForm, note: e.target.value })
              }
              placeholder="请输入场地说明"
            />
          </label>

          <label className="venues-field">
            <span>预约状态</span>
            <select
              value={venueForm.status}
              onChange={(e) =>
                setVenueForm({ ...venueForm, status: e.target.value })
              }
            >
              <option value="available">可预约</option>
              <option value="maintenance">维护中</option>
              <option value="unavailable">停用</option>
            </select>
          </label>

          <div className="venues-form-actions">
            <button type="submit">保存场地</button>
          </div>
        </form>
      </section>

      <section className="venues-list-panel">
        <div className="venues-section-heading">
          <div>
            <h2>场地资源</h2>
            <p>以资源卡片查看场地类型、容量、位置和预约状态。</p>
          </div>
        </div>

        {venues.length === 0 ? (
          <EmptyState
            icon="V"
            title="还没有场地"
            description="新增第一个场地后，它会显示在这里。"
          />
        ) : (
          <div className="venues-card-grid">
            {venues.map((venue) => (
              <ResourceCard
                key={venue.id}
                title={venue.name}
                description={summary(venue.note)}
                icon="V"
                tone={venueTone(venue.status)}
                meta={
                  <div className="venues-chip-row">
                    <StatusChip tone={statusTone(venue.status)}>
                      {statusLabel(venue.status)}
                    </StatusChip>
                    <span>{venue.venue_type || "其他"}</span>
                  </div>
                }
                footer={
                  <div className="venues-card-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditing({ ...venue })}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setDeleting(venue)}
                    >
                      删除
                    </button>
                  </div>
                }
              >
                <div className="venues-card-details">
                  <div>
                    <span>容量</span>
                    <strong>{venue.capacity ?? "-"} 人</strong>
                  </div>
                  <div>
                    <span>位置 / 房间</span>
                    <strong>{venue.location || "未填写"}</strong>
                  </div>
                </div>
              </ResourceCard>
            ))}
          </div>
        )}
      </section>

      <section className="venues-booking-panel">
        <div className="venues-section-heading">
          <div>
            <h2>预约申请</h2>
            <p>选择活动与可预约场地，提交指定时间段的场地申请。</p>
          </div>
        </div>

        {venueOptions.length === 0 ? (
          <EmptyState
            icon="V"
            title="暂无可预约场地"
            description="请先新增可预约场地后再提交预约申请。"
          />
        ) : activities.length === 0 ? (
          <EmptyState
            icon="A"
            title="暂无可预约活动"
            description="请先创建活动后再提交场地预约申请。"
          />
        ) : (
          <form className="venues-booking-form" onSubmit={createBooking}>
            <label className="venues-field">
              <span>活动</span>
              <select
                value={bookingForm.activity_id}
                onChange={(e) =>
                  setBookingForm({
                    ...bookingForm,
                    activity_id: e.target.value,
                  })
                }
                required
              >
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="venues-field">
              <span>场地</span>
              <select
                value={bookingForm.venue_id}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, venue_id: e.target.value })
                }
                required
              >
                {venueOptions.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}（{venue.location || "未填写位置"} /{" "}
                    {venue.venue_type || "其他"}）
                  </option>
                ))}
              </select>
            </label>

            <label className="venues-field">
              <span>开始时间</span>
              <input
                type="datetime-local"
                value={bookingForm.start_time}
                onChange={(e) =>
                  setBookingForm({
                    ...bookingForm,
                    start_time: e.target.value,
                  })
                }
              />
            </label>

            <label className="venues-field">
              <span>结束时间</span>
              <input
                type="datetime-local"
                value={bookingForm.end_time}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, end_time: e.target.value })
                }
              />
            </label>

            <label className="venues-field venues-field-wide">
              <span>预约用途</span>
              <input
                value={bookingForm.reason}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, reason: e.target.value })
                }
                placeholder="请输入预约用途"
              />
            </label>

            <div className="venues-form-actions">
              <button type="submit">提交预约</button>
            </div>
          </form>
        )}
      </section>

      <section className="venues-record-panel">
        <div className="venues-section-heading">
          <div>
            <h2>预约记录</h2>
            <p>查看预约状态，并保留原来的通过、拒绝、取消操作。</p>
          </div>
          <StatusChip tone="info">{bookings.length} 条</StatusChip>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon="B"
            title="暂无预约记录"
            description="提交场地预约申请后，记录会显示在这里。"
          />
        ) : (
          <div className="venues-booking-grid">
            {bookings.map((booking) => (
              <article className="venues-booking-card" key={booking.id}>
                <div className="venues-booking-card-head">
                  <div>
                    <h3>{booking.activity_name || booking.activity_id}</h3>
                    <p>{booking.venue_name || booking.venue_id}</p>
                  </div>
                  <StatusChip tone={statusTone(booking.status)}>
                    {statusLabel(booking.status)}
                  </StatusChip>
                </div>

                <div className="venues-booking-details">
                  <div>
                    <span>申请人</span>
                    <strong>
                      {booking.applicant_name || booking.applicant_id || "-"}
                    </strong>
                  </div>
                  <div>
                    <span>开始时间</span>
                    <strong>{formatDate(booking.start_time)}</strong>
                  </div>
                  <div>
                    <span>结束时间</span>
                    <strong>{formatDate(booking.end_time)}</strong>
                  </div>
                  <div>
                    <span>用途 / 说明</span>
                    <strong>{booking.reason || "未填写"}</strong>
                  </div>
                </div>

                <div className="venues-booking-actions">
                  <button
                    type="button"
                    onClick={() =>
                      act(() => venuesApi.approve(booking.id), "预约已通过")
                    }
                  >
                    通过
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () => venuesApi.reject(booking.id, "不符合条件"),
                        "预约已拒绝",
                      )
                    }
                    className="btn-secondary"
                  >
                    拒绝
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () => venuesApi.cancel(booking.id, "用户取消"),
                        "预约已取消",
                      )
                    }
                    className="btn-danger"
                  >
                    取消
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing ? (
        <div className="modal-mask">
          <div className="modal-card venues-modal-card">
            <h3>编辑场地</h3>

            <label className="venues-field">
              <span>场地名称</span>
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>

            <div className="venues-modal-grid">
              <label className="venues-field">
                <span>场地类型</span>
                <input
                  value={editing.venue_type || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, venue_type: e.target.value })
                  }
                />
              </label>

              <label className="venues-field">
                <span>容量</span>
                <input
                  type="number"
                  min={1}
                  value={editing.capacity || 1}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      capacity: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>

            <label className="venues-field">
              <span>位置 / 房间</span>
              <input
                value={editing.location || ""}
                onChange={(e) =>
                  setEditing({ ...editing, location: e.target.value })
                }
              />
            </label>

            <label className="venues-field">
              <span>说明</span>
              <input
                value={editing.note || ""}
                onChange={(e) =>
                  setEditing({ ...editing, note: e.target.value })
                }
              />
            </label>

            <label className="venues-field">
              <span>预约状态</span>
              <select
                value={editing.status || "available"}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
              >
                <option value="available">可预约</option>
                <option value="maintenance">维护中</option>
                <option value="unavailable">停用</option>
              </select>
            </label>

            <div className="btn-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(null)}
              >
                取消
              </button>
              <button type="button" onClick={saveVenue}>
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleting ? (
        <div className="modal-mask">
          <div className="modal-card venues-modal-card">
            <h3>确认删除</h3>
            <p>确定删除场地「{deleting.name}」吗？</p>

            <div className="btn-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleting(null)}
              >
                取消
              </button>
              <button type="button" className="btn-danger" onClick={deleteVenue}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
