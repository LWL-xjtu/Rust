import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { activitiesApi } from "../api/activities";
import ApiError from "../components/ApiError";

export default function ActivitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const nav = useNavigate();

  const load = async () => {
    try { setItems(await activitiesApi.list()); } catch (e: any) { setError(e.message); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>活动管理</h2>
      <form onSubmit={async (e) => { e.preventDefault(); await activitiesApi.create({ title }); setTitle(""); load(); }}>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="活动标题" required />
        <button>创建活动</button>
      </form>
      <ApiError error={error} />
      <table className="table"><thead><tr><th>标题</th><th>状态</th><th>操作</th></tr></thead><tbody>
        {items.map((a)=><tr key={a.id}><td>{a.title}</td><td>{a.status}</td><td>
          <button onClick={()=>nav(`/activities/${a.id}`)}>详情</button>
          <button onClick={async()=>{const t=prompt("新标题",a.title); if(t){await activitiesApi.update(a.id,{title:t}); load();}}}>编辑</button>
          <button onClick={async()=>{if(confirm("确认删除?") ){await activitiesApi.remove(a.id); load();}}}>删除</button>
        </td></tr>)}
      </tbody></table>
    </div>
  );
}
