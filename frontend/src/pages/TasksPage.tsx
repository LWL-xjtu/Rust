import { useEffect, useState } from "react";
import { tasksApi } from "../api/tasks";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [activityId, setActivityId] = useState("");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");

  const load = async () => setTasks(await tasksApi.list());
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>任务分工</h2>
      <form onSubmit={async (e)=>{e.preventDefault(); await tasksApi.create({activity_id:activityId,title,assignee_id:assignee||null}); setTitle(""); load();}}>
        <input value={activityId} onChange={(e)=>setActivityId(e.target.value)} placeholder="activity_id" required />
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="任务标题" required />
        <input value={assignee} onChange={(e)=>setAssignee(e.target.value)} placeholder="assignee_id" />
        <button>创建任务</button>
      </form>

      <table className="table"><thead><tr><th>标题</th><th>状态</th><th>操作</th></tr></thead><tbody>
      {tasks.map(t=><tr key={t.id}><td>{t.title}</td><td>{t.status}</td><td>
        <button onClick={async()=>{await tasksApi.updateStatus(t.id,{status:"in_progress",comment:"start"}); load();}}>进行中</button>
        <button onClick={async()=>{await tasksApi.updateStatus(t.id,{status:"done",comment:"done"}); load();}}>完成</button>
        <button onClick={async()=>{const c = prompt("进度说明"); if(c){await tasksApi.addProgressLog(t.id,{comment:c}); alert("已记录");}}}>写进度</button>
      </td></tr>)}
      </tbody></table>
    </div>
  );
}
