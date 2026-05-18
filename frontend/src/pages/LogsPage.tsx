import { useEffect, useState } from "react";
import { activitiesApi } from "../api/activities";
import { logsApi } from "../api/logs";
import ApiError from "../components/ApiError";
import { zhAction } from "../utils/display";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityId, setActivityId] = useState("");
  const [error, setError] = useState("");

  const loadAll = async () => {
    setError("");
    try {
      const [l, a] = await Promise.all([logsApi.list(), activitiesApi.list()]);
      setLogs(l);
      setActivities(a);
      if (!activityId && a.length > 0) setActivityId(a[0].id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filterByActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId) return;
    try {
      setLogs(await logsApi.byActivity(activityId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>操作日志</h2>
      <ApiError error={error} />
      <form onSubmit={filterByActivity}>
        <select value={activityId} onChange={(e) => setActivityId(e.target.value)}>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <button>按活动筛选</button>
        <button type="button" onClick={loadAll}>查看全部</button>
      </form>
      {logs.length === 0 ? <p>暂无操作日志，完成业务操作后会自动记录。</p> : null}
      <ul>{logs.map((l) => <li key={l.id}>{new Date(l.created_at).toLocaleString("zh-CN")} | {zhAction(l.action)} | {l.summary}</li>)}</ul>
    </div>
  );
}
