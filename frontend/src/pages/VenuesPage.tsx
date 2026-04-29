import { useEffect, useState } from "react";
import { venuesApi } from "../api/venues";

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [activityId, setActivityId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setVenues(await venuesApi.listVenues());
    setBookings(await venuesApi.listBookings());
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>场地预约</h2>
      <form onSubmit={async(e)=>{e.preventDefault(); try{await venuesApi.createVenue({name,location:"教学楼",capacity:100}); setName(""); load();}catch(err:any){setError(err.message)}}}>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="新增场地名称（admin）" />
        <button>新增场地</button>
      </form>
      <h3>场地列表</h3>
      <ul>{venues.map(v=><li key={v.id}>{v.name} / {v.status}</li>)}</ul>

      <h3>预约申请</h3>
      <form onSubmit={async(e)=>{e.preventDefault(); try{await venuesApi.createBooking({activity_id:activityId,venue_id:venueId,start_time:start,end_time:end}); load();}catch(err:any){setError(err.message)}}}>
        <input value={activityId} onChange={(e)=>setActivityId(e.target.value)} placeholder="activity_id" required />
        <input value={venueId} onChange={(e)=>setVenueId(e.target.value)} placeholder="venue_id" required />
        <input value={start} onChange={(e)=>setStart(e.target.value)} placeholder="2026-05-01T10:00:00Z" required />
        <input value={end} onChange={(e)=>setEnd(e.target.value)} placeholder="2026-05-01T12:00:00Z" required />
        <button>发起预约</button>
      </form>
      {error && <div className="error">{error}</div>}

      <h3>预约记录</h3>
      <table className="table"><thead><tr><th>ID</th><th>状态</th><th>操作</th></tr></thead><tbody>
      {bookings.map(b=><tr key={b.id}><td>{b.id}</td><td>{b.status}</td><td>
        <button onClick={async()=>{await venuesApi.approve(b.id);load();}}>通过</button>
        <button onClick={async()=>{await venuesApi.reject(b.id,"reject by ui");load();}}>驳回</button>
        <button onClick={async()=>{await venuesApi.cancel(b.id,"cancel by ui");load();}}>取消</button>
      </td></tr>)}
      </tbody></table>
    </div>
  );
}
