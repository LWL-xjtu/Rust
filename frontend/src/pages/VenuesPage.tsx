import { useEffect, useState } from "react";
import { activitiesApi } from "../api/activities";
import { venuesApi } from "../api/venues";
import ApiError from "../components/ApiError";

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [activityId, setActivityId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [v, b, a] = await Promise.all([
        venuesApi.listVenues(),
        venuesApi.listBookings(),
        activitiesApi.list(),
      ]);
      setVenues(v);
      setBookings(b);
      setActivities(a);
      if (!activityId && a.length > 0) setActivityId(a[0].id);
      if (!venueId && v.length > 0) setVenueId(v[0].id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    const now = new Date();
    const s = new Date(now.getTime() + 60 * 60 * 1000);
    const e = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setStart(s.toISOString().slice(0, 16));
    setEnd(e.toISOString().slice(0, 16));
  }, []);

  const createVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await venuesApi.createVenue({ name, location: "教学楼", capacity: 100, status: "available" });
      setName("");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await venuesApi.createBooking({
        activity_id: activityId,
        venue_id: venueId,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        reason: "课程演示预约",
      });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const action = async (fn: () => Promise<any>) => {
    try {
      await fn();
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>场地预约</h2>
      <ApiError error={error} />

      <form onSubmit={createVenue}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="新增场地名称（admin/teacher）" />
        <button type="submit">新增场地</button>
      </form>

      <h3>场地列表</h3>
      <ul>{venues.map((v) => <li key={v.id}>{v.name} / {v.location} / <span className={`status status-${v.status}`}>{v.status}</span></li>)}</ul>

      <h3>预约申请</h3>
      <form onSubmit={createBooking}>
        <select value={activityId} onChange={(e) => setActivityId(e.target.value)} required>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <select value={venueId} onChange={(e) => setVenueId(e.target.value)} required>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
        <button type="submit">发起预约</button>
      </form>

      <h3>预约记录</h3>
      <table className="table">
        <thead><tr><th>ID</th><th>状态</th><th>开始</th><th>结束</th><th>操作</th></tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.id.slice(0, 8)}...</td>
              <td><span className={`status status-${b.status}`}>{b.status}</span></td>
              <td>{b.start_time}</td>
              <td>{b.end_time}</td>
              <td>
                <button onClick={() => action(() => venuesApi.approve(b.id))}>通过</button>
                <button onClick={() => action(() => venuesApi.reject(b.id, "不符合条件"))}>驳回</button>
                <button onClick={() => action(() => venuesApi.cancel(b.id, "用户取消"))}>取消</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
