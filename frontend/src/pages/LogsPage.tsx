import { useEffect, useState } from "react";
import { logsApi } from "../api/logs";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [activityId, setActivityId] = useState("");

  useEffect(() => { logsApi.list().then(setLogs).catch(()=>setLogs([])); }, []);

  return (
    <div>
      <h2>操作日志</h2>
      <form onSubmit={async(e)=>{e.preventDefault(); if(activityId){setLogs(await logsApi.byActivity(activityId));}}}>
        <input value={activityId} onChange={(e)=>setActivityId(e.target.value)} placeholder="按 activity_id 筛选" />
        <button>筛选</button>
      </form>
      <ul>{logs.map(l=><li key={l.id}>{l.created_at} | {l.action} | {l.summary}</li>)}</ul>
    </div>
  );
}
