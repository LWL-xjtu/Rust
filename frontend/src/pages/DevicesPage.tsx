import { useEffect, useState } from "react";
import { devicesApi } from "../api/devices";

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [activityId, setActivityId] = useState("");
  const [deviceId, setDeviceId] = useState("");

  const load = async () => {
    setDevices(await devicesApi.listDevices());
    setBorrows(await devicesApi.listBorrows());
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>设备借用</h2>
      <form onSubmit={async(e)=>{e.preventDefault(); await devicesApi.createDevice({name,category:"general",serial_no:serial}); setName(""); setSerial(""); load();}}>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="设备名（admin）" />
        <input value={serial} onChange={(e)=>setSerial(e.target.value)} placeholder="序列号" />
        <button>创建设备</button>
      </form>

      <h3>设备列表</h3>
      <ul>{devices.map(d=><li key={d.id}>{d.name} / {d.status} / {d.serial_no}</li>)}</ul>

      <h3>借用申请</h3>
      <form onSubmit={async(e)=>{e.preventDefault(); await devicesApi.createBorrow({activity_id:activityId,device_id:deviceId,expected_return_time:new Date(Date.now()+86400000).toISOString()}); load();}}>
        <input value={activityId} onChange={(e)=>setActivityId(e.target.value)} placeholder="activity_id" />
        <input value={deviceId} onChange={(e)=>setDeviceId(e.target.value)} placeholder="device_id" />
        <button>申请借用</button>
      </form>

      <h3>借用记录</h3>
      <table className="table"><thead><tr><th>ID</th><th>状态</th><th>操作</th></tr></thead><tbody>
      {borrows.map(b=><tr key={b.id}><td>{b.id}</td><td>{b.status}</td><td>
        <button onClick={async()=>{await devicesApi.approveBorrow(b.id);load();}}>审批</button>
        <button onClick={async()=>{await devicesApi.checkoutBorrow(b.id);load();}}>借出</button>
        <button onClick={async()=>{await devicesApi.returnBorrow(b.id);load();}}>归还</button>
      </td></tr>)}
      </tbody></table>
    </div>
  );
}
