import { useEffect, useState } from "react";
import { statsApi } from "../api/stats";

export default function StatsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [activityId, setActivityId] = useState("");
  const [activityStats, setActivityStats] = useState<any>(null);

  useEffect(() => { statsApi.overview().then(setOverview); }, []);

  return (
    <div>
      <h2>统计</h2>
      {overview && <div className="cards">
        <div>活动: {overview.activities_count}</div>
        <div>预约: {overview.venue_bookings_count}</div>
        <div>借用: {overview.device_borrows_count}</div>
        <div>任务: {overview.tasks_count}</div>
        <div>完成任务: {overview.tasks_done_count}</div>
        <div>用户: {overview.users_count}</div>
      </div>}
      <form onSubmit={async(e)=>{e.preventDefault(); setActivityStats(await statsApi.byActivity(activityId));}}>
        <input value={activityId} onChange={(e)=>setActivityId(e.target.value)} placeholder="activity_id" />
        <button>查询活动统计</button>
      </form>
      {activityStats && <pre>{JSON.stringify(activityStats, null, 2)}</pre>}
    </div>
  );
}
