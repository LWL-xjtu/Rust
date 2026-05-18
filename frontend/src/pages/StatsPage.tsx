import { useEffect, useState } from "react";
import { activitiesApi } from "../api/activities";
import { statsApi } from "../api/stats";
import ApiError from "../components/ApiError";

function toPercent(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return `${n.toFixed(2)}%`;
}

export default function StatsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityId, setActivityId] = useState("");
  const [activityStats, setActivityStats] = useState<any>(null);
  const [collegeStats, setCollegeStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collegeLoading, setCollegeLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      setCollegeLoading(true);
      try {
        const [o, a, c] = await Promise.all([
          statsApi.overview(),
          activitiesApi.list(),
          statsApi.colleges(),
        ]);
        setOverview(o);
        setActivities(a);
        setCollegeStats(c);
        if (a.length > 0) setActivityId(a[0].id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setCollegeLoading(false);
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
      <h2>书院/学院统计</h2>
      <ApiError error={error} />

      {loading ? <p>加载统计中...</p> : null}
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

      <div className="panel">
        <h3>书院/学院统计</h3>
        <p>按用户所属书院/学院统计活动参与、任务完成、资源使用等情况。</p>
        {collegeLoading ? <p>加载中...</p> : null}
        {!collegeLoading && collegeStats.length === 0 ? <p>暂无书院/学院统计数据。</p> : null}
        {collegeStats.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>书院/学院</th>
                <th>用户数</th>
                <th>参与活动数</th>
                <th>任务总数</th>
                <th>已完成任务数</th>
                <th>任务完成率</th>
                <th>场地预约数</th>
                <th>设备借用数</th>
                <th>进度记录数</th>
              </tr>
            </thead>
            <tbody>
              {collegeStats.map((row) => (
                <tr key={row.college}>
                  <td>{row.college}</td>
                  <td>{row.member_count}</td>
                  <td>{row.activity_count}</td>
                  <td>{row.task_count}</td>
                  <td>{row.completed_task_count}</td>
                  <td style={{ minWidth: 190 }}>
                    <div style={{ background: "#e8edf6", borderRadius: 999, height: 10 }}>
                      <div
                        style={{
                          width: `${Math.min(100, Number(row.task_completion_rate) || 0)}%`,
                          height: 10,
                          borderRadius: 999,
                          background: "#1f6a3f",
                        }}
                      />
                    </div>
                    <small>{toPercent(Number(row.task_completion_rate))}</small>
                  </td>
                  <td>{row.venue_reservation_count}</td>
                  <td>{row.equipment_borrow_count}</td>
                  <td>{row.progress_log_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <form onSubmit={queryActivityStats}>
        <select value={activityId} onChange={(e) => setActivityId(e.target.value)}>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
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
          <ul>
            {(activityStats.recent_logs || []).map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
