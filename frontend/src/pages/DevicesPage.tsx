import { useEffect, useState } from "react";
import { activitiesApi } from "../api/activities";
import { devicesApi } from "../api/devices";
import ApiError from "../components/ApiError";
import { zhStatus } from "../utils/display";

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deviceForm, setDeviceForm] = useState({
    name: "",
    category: "开发板",
    serial_no: "",
    location: "",
    quantity: 1,
    status: "available",
    description: "",
  });
  const [borrowForm, setBorrowForm] = useState({
    activity_id: "",
    device_id: "",
    quantity: 1,
    start_time: "",
    expected_return_time: "",
    purpose: "",
    remark: "",
  });

  const load = async () => {
    try {
      const [d, b, a] = await Promise.all([devicesApi.listDevices(), devicesApi.listBorrows(), activitiesApi.list()]);
      setDevices(d);
      setBorrows(b);
      setActivities(a);
      setBorrowForm((s) => ({ ...s, activity_id: s.activity_id || a[0]?.id || "", device_id: s.device_id || d[0]?.id || "" }));
    } catch (err: any) {
      setError(err.message);
    }
  };
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 60 * 1000);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setBorrowForm((s) => ({ ...s, start_time: start.toISOString().slice(0, 16), expected_return_time: end.toISOString().slice(0, 16) }));
    load();
  }, []);

  const act = async (fn: () => Promise<any>, msg: string) => {
    try {
      await fn();
      setSuccess(msg);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>设备借用</h2>
      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}

      <div className="panel">
        <h3>新增设备</h3>
        <form onSubmit={(e) => { e.preventDefault(); act(() => devicesApi.createDevice(deviceForm), "设备新增成功"); }}>
          <input value={deviceForm.name} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} placeholder="设备名称" required />
          <select value={deviceForm.category} onChange={(e) => setDeviceForm({ ...deviceForm, category: e.target.value })}>
            <option>开发板</option><option>实验仪器</option><option>工具箱</option><option>摄像设备</option><option>音响设备</option><option>其他</option>
          </select>
          <input value={deviceForm.serial_no} onChange={(e) => setDeviceForm({ ...deviceForm, serial_no: e.target.value })} placeholder="设备编号" required />
          <input value={deviceForm.location} onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })} placeholder="存放位置" />
          <input type="number" min={1} value={deviceForm.quantity} onChange={(e) => setDeviceForm({ ...deviceForm, quantity: Number(e.target.value) })} />
          <select value={deviceForm.status} onChange={(e) => setDeviceForm({ ...deviceForm, status: e.target.value })}>
            <option value="available">可借</option><option value="borrowed">借出中</option><option value="maintenance">维修中</option><option value="disabled">停用</option>
          </select>
          <input value={deviceForm.description} onChange={(e) => setDeviceForm({ ...deviceForm, description: e.target.value })} placeholder="说明" />
          <button type="submit">保存设备</button>
        </form>
      </div>

      <div className="panel">
        <h3>借用申请</h3>
        {activities.length === 0 ? <p>暂无活动，请先创建活动。</p> : null}
        {devices.length === 0 ? <p>暂无可借设备，请先新增设备。</p> : null}
        <form onSubmit={(e) => {
          e.preventDefault();
          act(() => devicesApi.createBorrow({
            ...borrowForm,
            start_time: new Date(borrowForm.start_time).toISOString(),
            expected_return_time: new Date(borrowForm.expected_return_time).toISOString(),
          }), "借用申请已提交");
        }}>
          <select value={borrowForm.activity_id} onChange={(e) => setBorrowForm({ ...borrowForm, activity_id: e.target.value })}>{activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select>
          <select value={borrowForm.device_id} onChange={(e) => setBorrowForm({ ...borrowForm, device_id: e.target.value })}>{devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <input type="number" min={1} value={borrowForm.quantity} onChange={(e) => setBorrowForm({ ...borrowForm, quantity: Number(e.target.value) })} />
          <input type="datetime-local" value={borrowForm.start_time} onChange={(e) => setBorrowForm({ ...borrowForm, start_time: e.target.value })} />
          <input type="datetime-local" value={borrowForm.expected_return_time} onChange={(e) => setBorrowForm({ ...borrowForm, expected_return_time: e.target.value })} />
          <input value={borrowForm.purpose} onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })} placeholder="借用用途" />
          <button type="submit">提交申请</button>
        </form>
      </div>

      <table className="table">
        <thead><tr><th>活动名称</th><th>设备名称</th><th>借用人</th><th>借用数量</th><th>状态</th><th>借用时间</th><th>预计归还</th><th>实际归还</th><th>操作</th></tr></thead>
        <tbody>
          {borrows.map((b) => (
            <tr key={b.id}>
              <td>{b.activity_name || b.activity_id}</td>
              <td>{b.device_name || b.device_id}</td>
              <td>{b.borrower_name || b.borrower_id}</td>
              <td>{b.quantity || 1}</td>
              <td><span className={`status status-${b.status}`}>{zhStatus(b.status)}</span></td>
              <td>{b.start_time ? new Date(b.start_time).toLocaleString("zh-CN") : "-"}</td>
              <td>{new Date(b.expected_return_time).toLocaleString("zh-CN")}</td>
              <td>{b.actual_return_time ? new Date(b.actual_return_time).toLocaleString("zh-CN") : "-"}</td>
              <td>
                <button onClick={() => act(() => devicesApi.approveBorrow(b.id), "审批通过")}>审批</button>
                <button className="btn-secondary" onClick={() => act(() => devicesApi.rejectBorrow(b.id, "不符合要求"), "已拒绝")}>拒绝</button>
                <button onClick={() => act(() => devicesApi.checkoutBorrow(b.id), "已确认借出")}>确认借出</button>
                <button onClick={() => act(() => devicesApi.returnBorrow(b.id), "已确认归还")}>确认归还</button>
                <button className="btn-danger" onClick={() => act(() => devicesApi.cancelBorrow(b.id, "取消"), "已取消")}>取消</button>
              </td>
            </tr>
          ))}
          {borrows.length === 0 ? <tr><td colSpan={9}>暂无数据，请先创建借用申请。</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
