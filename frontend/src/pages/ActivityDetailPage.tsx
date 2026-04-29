import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { activitiesApi } from "../api/activities";

export default function ActivityDetailPage() {
  const { id = "" } = useParams();
  const [activity, setActivity] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [memberUserId, setMemberUserId] = useState("");

  const load = async () => {
    const [a, t, l] = await Promise.all([activitiesApi.get(id), activitiesApi.tasks(id), activitiesApi.logs(id)]);
    setActivity(a); setTasks(t); setLogs(l);
  };

  useEffect(() => { if(id) load(); }, [id]);

  if (!activity) return <div>Loading...</div>;

  return (
    <div>
      <h2>活动详情</h2>
      <p>{activity.title} / {activity.status}</p>
      <p>{activity.description}</p>

      <h3>添加成员</h3>
      <form onSubmit={async (e)=>{e.preventDefault(); await activitiesApi.addMember(id,{user_id:memberUserId}); setMemberUserId(""); alert("已添加");}}>
        <input value={memberUserId} onChange={(e)=>setMemberUserId(e.target.value)} placeholder="成员 user_id" required />
        <button>添加成员</button>
      </form>

      <h3>任务摘要</h3>
      <ul>{tasks.map(t=><li key={t.id}>{t.title} - {t.status}</li>)}</ul>

      <h3>操作日志</h3>
      <ul>{logs.map(l=><li key={l.id}>{l.summary}</li>)}</ul>
    </div>
  );
}
