import { useEffect, useState } from "react";
import { activitiesApi } from "../api/activities";
import { devicesApi } from "../api/devices";
import ApiError from "../components/ApiError";

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [activityId, setActivityId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [d, b, a] = await Promise.all([
        devicesApi.listDevices(),
        devicesApi.listBorrows(),
        activitiesApi.list(),
      ]);
      setDevices(d);
      setBorrows(b);
      setActivities(a);
      if (!activityId && a.length > 0) setActivityId(a[0].id);
      if (!deviceId && d.length > 0) setDeviceId(d[0].id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await devicesApi.createDevice({
        name,
        category: "general",
        serial_no: serial,
        status: "available",
      });
      setName("");
      setSerial("");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await devicesApi.createBorrow({
        activity_id: activityId,
        device_id: deviceId,
        expected_return_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        remark: "课程演示借用",
      });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const action = async (fn: () => Promise<any>) => {
    try {
      await fn();
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>设备借用</h2>
      <ApiError error={error} />

      <form onSubmit={createDevice}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="设备名（admin/teacher）" />
        <input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="序列号" />
        <button type="submit">创建设备</button>
      </form>

      <h3>设备列表</h3>
      <ul>{devices.map((d) => <li key={d.id}>{d.name} / {d.serial_no} / <span className={`status status-${d.status}`}>{d.status}</span></li>)}</ul>

      <h3>借用申请</h3>
      <form onSubmit={createBorrow}>
        <select value={activityId} onChange={(e) => setActivityId(e.target.value)} required>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="submit">申请借用</button>
      </form>

      <h3>借用记录</h3>
      <table className="table">
        <thead><tr><th>ID</th><th>状态</th><th>设备</th><th>操作</th></tr></thead>
        <tbody>
          {borrows.map((b) => (
            <tr key={b.id}>
              <td>{b.id.slice(0, 8)}...</td>
              <td><span className={`status status-${b.status}`}>{b.status}</span></td>
              <td>{b.device_id}</td>
              <td>
                <button onClick={() => action(() => devicesApi.approveBorrow(b.id))}>审批</button>
                <button onClick={() => action(() => devicesApi.rejectBorrow(b.id, "不符合要求"))}>驳回</button>
                <button onClick={() => action(() => devicesApi.checkoutBorrow(b.id))}>借出</button>
                <button onClick={() => action(() => devicesApi.returnBorrow(b.id))}>归还</button>
                <button onClick={() => action(() => devicesApi.cancelBorrow(b.id, "用户取消"))}>取消</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
