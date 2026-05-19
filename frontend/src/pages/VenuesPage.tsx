import { useEffect, useMemo, useState } from "react";
import { activitiesApi } from "../api/activities";
import { venuesApi } from "../api/venues";
import ApiError from "../components/ApiError";
import { zhStatus } from "../utils/display";

type Venue = {
  id: string;
  name: string;
  venue_type?: string;
  capacity?: number;
  location?: string;
  status?: string;
};

const CAMPUS_LOCATIONS = [
  "创新港-泓理楼A区1层",
  "创新港-泓理楼A区2层",
  "创新港-涵英楼报告厅",
  "兴庆校区-主楼B座101",
  "兴庆校区-图书馆一层研讨室",
  "雁塔校区-教学楼3号楼201",
  "雁塔校区-体育馆多功能厅",
  "曲江校区-工程训练中心",
  "钱学森书院活动中心",
  "仲英书院共享讨论区",
  "其他（手动填写）",
];

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [locationPreset, setLocationPreset] = useState(CAMPUS_LOCATIONS[0]);
  const [locationDetail, setLocationDetail] = useState("");

  const [venueForm, setVenueForm] = useState({
    name: "",
    venue_type: "实验室",
    capacity: 50,
    location: "",
    note: "",
    status: "available",
  });

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
    for (const v of venues) {
      const key = `${(v.name || "").trim().toLowerCase()}|${(v.location || "").trim().toLowerCase()}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(v);
    }
    return unique;
  }, [venues]);

  const load = async () => {
    try {
      setError("");
      const [v, b, a] = await Promise.all([
        venuesApi.listVenues(),
        venuesApi.listBookings(),
        activitiesApi.list(),
      ]);
      setVenues(v);
      setBookings(b);
      setActivities(a);
      setBookingForm((s) => ({
        ...s,
        activity_id: s.activity_id || a[0]?.id || "",
        venue_id: s.venue_id || v[0]?.id || "",
      }));
    } catch (err: any) {
      setError(err.message || "加载失败，请稍后重试");
    }
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setBookingForm((f) => ({
      ...f,
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
    }));
    load();
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

  const createVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = buildLocation();
    if (!finalLocation) {
      setError("请填写场地位置");
      return;
    }
    try {
      setError("");
      await venuesApi.createVenue({ ...venueForm, location: finalLocation });
      setSuccess("场地新增成功");
      setVenueForm((v) => ({ ...v, name: "", note: "" }));
      setLocationDetail("");
      await load();
    } catch (err: any) {
      setError(err.message || "场地新增失败");
    }
  };

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
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
      await fn();
      setSuccess(msg);
      await load();
    } catch (err: any) {
      setError(err.message || "操作失败");
    }
  };

  return (
    <div>
      <h2>场地预约</h2>
      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}

      <div className="panel">
        <h3>新增场地</h3>
        <form onSubmit={createVenue}>
          <input
            value={venueForm.name}
            onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
            placeholder="场地名称"
            required
          />
          <select
            value={venueForm.venue_type}
            onChange={(e) => setVenueForm({ ...venueForm, venue_type: e.target.value })}
          >
            <option>实验室</option>
            <option>会议室</option>
            <option>讨论室</option>
            <option>自习室</option>
            <option>活动室</option>
            <option>体育场地</option>
          </select>
          <input
            type="number"
            min={1}
            value={venueForm.capacity}
            onChange={(e) => setVenueForm({ ...venueForm, capacity: Number(e.target.value) })}
            placeholder="容纳人数"
          />
          <select value={locationPreset} onChange={(e) => setLocationPreset(e.target.value)}>
            {CAMPUS_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <input
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder={
              locationPreset === "其他（手动填写）"
                ? "请手动输入完整位置，如：创新港-某楼-某房间"
                : "补充房间/门牌，例如：西一楼107"
            }
            required={locationPreset === "其他（手动填写）"}
          />
          <input
            value={venueForm.note}
            onChange={(e) => setVenueForm({ ...venueForm, note: e.target.value })}
            placeholder="说明"
          />
          <select
            value={venueForm.status}
            onChange={(e) => setVenueForm({ ...venueForm, status: e.target.value })}
          >
            <option value="available">可预约</option>
            <option value="maintenance">维护中</option>
            <option value="unavailable">停用</option>
          </select>
          <button type="submit">保存场地</button>
        </form>
      </div>

      <div className="panel">
        <h3>预约申请</h3>
        {activities.length === 0 ? <p>暂无可预约活动，请先创建活动。</p> : null}
        {venueOptions.length === 0 ? <p>暂无可预约场地，请先新增场地。</p> : null}
        <form onSubmit={createBooking}>
          <select
            value={bookingForm.activity_id}
            onChange={(e) =>
              setBookingForm({ ...bookingForm, activity_id: e.target.value })
            }
            required
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          <select
            value={bookingForm.venue_id}
            onChange={(e) => setBookingForm({ ...bookingForm, venue_id: e.target.value })}
            required
          >
            {venueOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}（{v.location || "未填写位置"} / {v.venue_type || "其他"}）
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={bookingForm.start_time}
            onChange={(e) =>
              setBookingForm({ ...bookingForm, start_time: e.target.value })
            }
          />
          <input
            type="datetime-local"
            value={bookingForm.end_time}
            onChange={(e) =>
              setBookingForm({ ...bookingForm, end_time: e.target.value })
            }
          />
          <input
            value={bookingForm.reason}
            onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
            placeholder="预约用途"
          />
          <button type="submit">提交预约</button>
        </form>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>活动名称</th>
            <th>场地名称</th>
            <th>申请人</th>
            <th>状态</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.activity_name || b.activity_id}</td>
              <td>{b.venue_name || b.venue_id}</td>
              <td>{b.applicant_name || b.applicant_id}</td>
              <td>
                <span className={`status status-${b.status}`}>
                  {zhStatus(b.status)}
                </span>
              </td>
              <td>{new Date(b.start_time).toLocaleString("zh-CN")}</td>
              <td>{new Date(b.end_time).toLocaleString("zh-CN")}</td>
              <td>
                <button onClick={() => act(() => venuesApi.approve(b.id), "预约已通过")}>
                  通过
                </button>
                <button
                  onClick={() => act(() => venuesApi.reject(b.id, "不符合条件"), "预约已拒绝")}
                  className="btn-secondary"
                >
                  拒绝
                </button>
                <button
                  onClick={() => act(() => venuesApi.cancel(b.id, "用户取消"), "预约已取消")}
                  className="btn-danger"
                >
                  取消
                </button>
              </td>
            </tr>
          ))}
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={7}>暂无数据，请先创建预约申请。</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
