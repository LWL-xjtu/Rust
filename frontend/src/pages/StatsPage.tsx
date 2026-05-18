import { useEffect, useState } from "react";
import { activitiesApi } from "../api/activities";
import { statsApi } from "../api/stats";
import ApiError from "../components/ApiError";

export default function StatsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityId, setActivityId] = useState("");
  const [activityStats, setActivityStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [o, a] = await Promise.all([statsApi.overview(), activitiesApi.list()]);
        setOverview(o);
        setActivities(a);
        if (a.length > 0) setActivityId(a[0].id);
      } catch (err: any) {
        setError(err.message);
      }
    })();
  }, []);

  const queryActivityStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId) return;
    try {
      setActivityStats(await statsApi.byActivity(activityId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>统计</h2>
      <ApiError error={error} />
      {overview && (
        <div className="cards">
          <div>活动: {overview.activities_count}</div>
          <div>预约: {overview.venue_bookings_count}</div>
          <div>借用: {overview.device_borrows_count}</div>
          <div>任务: {overview.tasks_count}</div>
          <div>完成任务: {overview.tasks_done_count}</div>
          <div>用户: {overview.users_count}</div>
        </div>
      )}
      <form onSubmit={queryActivityStats}>
        <select value={activityId} onChange={(e) => setActivityId(e.target.value)}>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <button>查询活动统计</button>
      </form>
      {activityStats && (
        <div className="panel">
          <p>成员数：{activityStats.members_count}</p>
          <p>任务总数：{activityStats.tasks_count}</p>
          <p>已完成任务：{activityStats.tasks_done_count}</p>
          <p>场地预约数：{activityStats.venue_bookings_count}</p>
          <p>设备借用数：{activityStats.device_borrows_count}</p>
          <p>最近日志：</p>
          <ul>{(activityStats.recent_logs || []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
