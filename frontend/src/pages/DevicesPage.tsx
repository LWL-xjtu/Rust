import { useEffect, useMemo, useState, type FormEvent } from "react";

import { activitiesApi } from "../api/activities";
import { devicesApi } from "../api/devices";
import ApiError from "../components/ApiError";
import {
  EmptyState,
  PageHeader,
  ResourceCard,
  StatCard,
  StatusChip,
  type StatusTone,
  type VisualTone,
} from "../components/ui";

import "../styles/devices.css";

type Device = {
  id: string;
  name: string;
  category?: string;
  serial_no?: string;
  location?: string;
  quantity?: number;
  status?: string;
  description?: string | null;
};

type BorrowRecord = {
  id: string;
  activity_id: string;
  device_id: string;
  borrower_id?: string;
  activity_name?: string | null;
  device_name?: string | null;
  borrower_name?: string | null;
  approver_id?: string | null;
  borrow_time?: string | null;
  start_time?: string | null;
  expected_return_time?: string;
  actual_return_time?: string | null;
  quantity?: number;
  purpose?: string | null;
  status?: string;
  remark?: string | null;
  created_at?: string;
};

type Activity = {
  id: string;
  title: string;
};

type DeviceForm = {
  name: string;
  category: string;
  serial_no: string;
  location: string;
  quantity: number;
  status: string;
  description: string;
};

const initialDeviceForm: DeviceForm = {
  name: "",
  category: "开发板",
  serial_no: "",
  location: "",
  quantity: 1,
  status: "available",
  description: "",
};

function statusTone(status?: string): StatusTone {
  if (status === "available" || status === "returned") return "success";
  if (status === "pending") return "warning";
  if (status === "approved" || status === "borrowed") return "info";
  if (status === "maintenance" || status === "rejected") return "danger";
  if (status === "disabled" || status === "cancelled") return "neutral";
  return "neutral";
}

function statusLabel(status?: string) {
  const map: Record<string, string> = {
    available: "可借",
    pending: "待审批",
    approved: "已通过",
    borrowed: "借用中",
    returned: "已归还",
    maintenance: "维修中",
    rejected: "已拒绝",
    disabled: "停用",
    cancelled: "已取消",
  };

  return map[status || ""] || status || "-";
}

function deviceTone(status?: string): VisualTone {
  const tone = statusTone(status);
  if (tone === "success") return "green";
  if (tone === "danger") return "rose";
  if (tone === "warning") return "amber";
  if (tone === "info") return "blue";
  return "neutral";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function summary(value?: string | null) {
  const text = value?.trim();
  if (!text) return "暂无说明";
  if (text.length <= 72) return text;
  return `${text.slice(0, 72)}...`;
}

function buildDevicePayload(device: Device) {
  return {
    name: device.name,
    category: device.category,
    location: device.location,
    quantity: device.quantity,
    status: device.status,
    description: device.description || null,
  };
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState<Device | null>(null);
  const [deviceForm, setDeviceForm] = useState<DeviceForm>(initialDeviceForm);
  const [borrowForm, setBorrowForm] = useState({
    activity_id: "",
    device_id: "",
    quantity: 1,
    start_time: "",
    expected_return_time: "",
    purpose: "",
    remark: "",
  });

  const availableDevices = useMemo(
    () => devices.filter((device) => device.status === "available"),
    [devices],
  );

  const metrics = useMemo(
    () => ({
      total: devices.length,
      available: availableDevices.length,
      borrows: borrows.length,
      pending: borrows.filter((borrow) => borrow.status === "pending").length,
      borrowed: borrows.filter((borrow) => borrow.status === "borrowed").length,
      returned: borrows.filter((borrow) => borrow.status === "returned").length,
    }),
    [availableDevices.length, borrows, devices.length],
  );

  const load = async () => {
    try {
      setError("");
      const [deviceList, borrowList, activityList] = await Promise.all([
        devicesApi.listDevices(),
        devicesApi.listBorrows(),
        activitiesApi.list(),
      ]);

      setDevices(deviceList as Device[]);
      setBorrows(borrowList as BorrowRecord[]);
      setActivities(activityList as Activity[]);
      setBorrowForm((state) => ({
        ...state,
        activity_id: state.activity_id || activityList[0]?.id || "",
        device_id: state.device_id || deviceList[0]?.id || "",
      }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 60 * 1000);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    setBorrowForm((state) => ({
      ...state,
      start_time: start.toISOString().slice(0, 16),
      expected_return_time: end.toISOString().slice(0, 16),
    }));

    void load();
  }, []);

  useEffect(() => {
    if (!borrowForm.device_id && availableDevices.length > 0) {
      setBorrowForm((state) => ({
        ...state,
        device_id: availableDevices[0].id,
      }));
    }
  }, [availableDevices, borrowForm.device_id]);

  const act = async (fn: () => Promise<any>, msg: string) => {
    try {
      setError("");
      setSuccess("");
      await fn();
      setSuccess(msg);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createDevice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await act(() => devicesApi.createDevice(deviceForm), "设备新增成功");
    setDeviceForm((form) => ({
      ...form,
      name: "",
      serial_no: "",
      description: "",
    }));
  };

  const saveDevice = async () => {
    if (!editing) return;
    await act(
      () => devicesApi.updateDevice(editing.id, buildDevicePayload(editing)),
      "设备已更新",
    );
    setEditing(null);
  };

  const deleteDevice = async () => {
    if (!deleting) return;
    await act(() => devicesApi.deleteDevice(deleting.id), "设备已删除");
    setDeleting(null);
  };

  const createBorrow = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await act(
      () =>
        devicesApi.createBorrow({
          ...borrowForm,
          start_time: new Date(borrowForm.start_time).toISOString(),
          expected_return_time: new Date(
            borrowForm.expected_return_time,
          ).toISOString(),
        }),
      "借用申请已提交",
    );
  };

  return (
    <section className="devices-page page-stack">
      <PageHeader
        eyebrow="Devices"
        title="设备借用"
        description="管理校园设备库存，提交和跟踪借用申请。"
        actions={<StatusChip tone="info">{metrics.total} 台设备</StatusChip>}
      />

      <ApiError error={error} />
      {success ? <div className="success">{success}</div> : null}

      <div className="devices-metric-grid">
        <StatCard
          label="设备总数"
          value={metrics.total.toLocaleString("zh-CN")}
          description="当前登记的设备资源"
          icon="D"
          tone="cyan"
        />
        <StatCard
          label="可借设备"
          value={metrics.available.toLocaleString("zh-CN")}
          description="状态为可借的设备"
          icon="A"
          tone="green"
        />
        <StatCard
          label="借用申请"
          value={metrics.borrows.toLocaleString("zh-CN")}
          description="当前可见借用记录"
          icon="B"
          tone="blue"
        />
        <StatCard
          label="待审批"
          value={metrics.pending.toLocaleString("zh-CN")}
          description={`借用中 ${metrics.borrowed} / 已归还 ${metrics.returned}`}
          icon="P"
          tone="amber"
        />
      </div>

      <section className="devices-create-panel">
        <div className="devices-section-heading">
          <div>
            <h2>新增设备</h2>
            <p>登记设备库存信息，并设置当前是否可借。</p>
          </div>
        </div>

        <form className="devices-form" onSubmit={createDevice}>
          <label className="devices-field">
            <span>设备名称</span>
            <input
              value={deviceForm.name}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, name: e.target.value })
              }
              placeholder="请输入设备名称"
              required
            />
          </label>

          <label className="devices-field">
            <span>设备类别</span>
            <select
              value={deviceForm.category}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, category: e.target.value })
              }
            >
              <option>开发板</option>
              <option>实验仪器</option>
              <option>工具箱</option>
              <option>摄像设备</option>
              <option>音响设备</option>
              <option>其他</option>
            </select>
          </label>

          <label className="devices-field">
            <span>设备编号</span>
            <input
              value={deviceForm.serial_no}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, serial_no: e.target.value })
              }
              placeholder="请输入设备编号"
              required
            />
          </label>

          <label className="devices-field">
            <span>存放位置</span>
            <input
              value={deviceForm.location}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, location: e.target.value })
              }
              placeholder="请输入存放位置"
            />
          </label>

          <label className="devices-field">
            <span>库存数量</span>
            <input
              type="number"
              min={1}
              value={deviceForm.quantity}
              onChange={(e) =>
                setDeviceForm({
                  ...deviceForm,
                  quantity: Number(e.target.value),
                })
              }
            />
          </label>

          <label className="devices-field">
            <span>设备状态</span>
            <select
              value={deviceForm.status}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, status: e.target.value })
              }
            >
              <option value="available">可借</option>
              <option value="borrowed">借出中</option>
              <option value="maintenance">维修中</option>
              <option value="disabled">停用</option>
            </select>
          </label>

          <label className="devices-field devices-field-wide">
            <span>说明</span>
            <input
              value={deviceForm.description}
              onChange={(e) =>
                setDeviceForm({
                  ...deviceForm,
                  description: e.target.value,
                })
              }
              placeholder="请输入设备说明"
            />
          </label>

          <div className="devices-form-actions">
            <button type="submit">保存设备</button>
          </div>
        </form>
      </section>

      <section className="devices-list-panel">
        <div className="devices-section-heading">
          <div>
            <h2>设备库存</h2>
            <p>以资源卡片查看设备类别、编号、库存、位置和借用状态。</p>
          </div>
        </div>

        {devices.length === 0 ? (
          <EmptyState
            icon="D"
            title="还没有设备"
            description="新增第一个设备后，它会显示在这里。"
          />
        ) : (
          <div className="devices-card-grid">
            {devices.map((device) => {
              const quantity = device.quantity ?? 0;
              const stockPercent = device.status === "available" ? 100 : 18;

              return (
                <ResourceCard
                  key={device.id}
                  title={device.name}
                  description={summary(device.description)}
                  icon="D"
                  tone={deviceTone(device.status)}
                  meta={
                    <div className="devices-chip-row">
                      <StatusChip tone={statusTone(device.status)}>
                        {statusLabel(device.status)}
                      </StatusChip>
                      <span>{device.category || "其他"}</span>
                    </div>
                  }
                  footer={
                    <div className="devices-card-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditing({ ...device })}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => setDeleting(device)}
                      >
                        删除
                      </button>
                    </div>
                  }
                >
                  <div className="devices-card-details">
                    <div>
                      <span>设备编号</span>
                      <strong>{device.serial_no || "-"}</strong>
                    </div>
                    <div>
                      <span>存放位置</span>
                      <strong>{device.location || "未填写"}</strong>
                    </div>
                    <div>
                      <span>库存数量</span>
                      <strong>{quantity} 件</strong>
                    </div>
                  </div>

                  <div className="devices-stock-track">
                    <div style={{ width: `${stockPercent}%` }} />
                  </div>
                  <div className="devices-stock-caption">
                    {device.status === "available" ? "当前可借" : "当前不可直接借用"}
                  </div>
                </ResourceCard>
              );
            })}
          </div>
        )}
      </section>

      <section className="devices-borrow-panel">
        <div className="devices-section-heading">
          <div>
            <h2>借用申请</h2>
            <p>选择活动与可借设备，提交指定数量和归还时间的借用申请。</p>
          </div>
        </div>

        {availableDevices.length === 0 ? (
          <EmptyState
            icon="D"
            title="暂无可借设备"
            description="请先新增可借设备后再提交借用申请。"
          />
        ) : activities.length === 0 ? (
          <EmptyState
            icon="A"
            title="暂无可关联活动"
            description="请先创建活动后再提交设备借用申请。"
          />
        ) : (
          <form className="devices-borrow-form" onSubmit={createBorrow}>
            <label className="devices-field">
              <span>活动</span>
              <select
                value={borrowForm.activity_id}
                onChange={(e) =>
                  setBorrowForm({
                    ...borrowForm,
                    activity_id: e.target.value,
                  })
                }
              >
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="devices-field">
              <span>设备</span>
              <select
                value={borrowForm.device_id}
                onChange={(e) =>
                  setBorrowForm({ ...borrowForm, device_id: e.target.value })
                }
              >
                {availableDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}（{device.category || "其他"} / 库存{" "}
                    {device.quantity ?? 0}）
                  </option>
                ))}
              </select>
            </label>

            <label className="devices-field">
              <span>借用数量</span>
              <input
                type="number"
                min={1}
                value={borrowForm.quantity}
                onChange={(e) =>
                  setBorrowForm({
                    ...borrowForm,
                    quantity: Number(e.target.value),
                  })
                }
              />
            </label>

            <label className="devices-field">
              <span>借用时间</span>
              <input
                type="datetime-local"
                value={borrowForm.start_time}
                onChange={(e) =>
                  setBorrowForm({
                    ...borrowForm,
                    start_time: e.target.value,
                  })
                }
              />
            </label>

            <label className="devices-field">
              <span>预计归还时间</span>
              <input
                type="datetime-local"
                value={borrowForm.expected_return_time}
                onChange={(e) =>
                  setBorrowForm({
                    ...borrowForm,
                    expected_return_time: e.target.value,
                  })
                }
              />
            </label>

            <label className="devices-field devices-field-wide">
              <span>借用用途</span>
              <input
                value={borrowForm.purpose}
                onChange={(e) =>
                  setBorrowForm({ ...borrowForm, purpose: e.target.value })
                }
                placeholder="请输入借用用途"
              />
            </label>

            <div className="devices-form-actions">
              <button type="submit">提交申请</button>
            </div>
          </form>
        )}
      </section>

      <section className="devices-record-panel">
        <div className="devices-section-heading">
          <div>
            <h2>借用记录</h2>
            <p>查看借用周期和流转状态，保留审批、借出、归还、取消操作。</p>
          </div>
          <StatusChip tone="info">{borrows.length} 条</StatusChip>
        </div>

        {borrows.length === 0 ? (
          <EmptyState
            icon="B"
            title="暂无借用记录"
            description="提交设备借用申请后，记录会显示在这里。"
          />
        ) : (
          <div className="devices-borrow-grid">
            {borrows.map((borrow) => (
              <article className="devices-borrow-card" key={borrow.id}>
                <div className="devices-borrow-card-head">
                  <div>
                    <h3>{borrow.activity_name || borrow.activity_id}</h3>
                    <p>{borrow.device_name || borrow.device_id}</p>
                  </div>
                  <StatusChip tone={statusTone(borrow.status)}>
                    {statusLabel(borrow.status)}
                  </StatusChip>
                </div>

                <div className="devices-borrow-details">
                  <div>
                    <span>借用人</span>
                    <strong>{borrow.borrower_name || borrow.borrower_id || "-"}</strong>
                  </div>
                  <div>
                    <span>借用数量</span>
                    <strong>{borrow.quantity || 1} 件</strong>
                  </div>
                  <div>
                    <span>借用时间</span>
                    <strong>{formatDate(borrow.start_time || borrow.borrow_time)}</strong>
                  </div>
                  <div>
                    <span>预计归还</span>
                    <strong>{formatDate(borrow.expected_return_time)}</strong>
                  </div>
                  <div>
                    <span>实际归还</span>
                    <strong>{formatDate(borrow.actual_return_time)}</strong>
                  </div>
                  <div>
                    <span>用途 / 备注</span>
                    <strong>{borrow.purpose || borrow.remark || "未填写"}</strong>
                  </div>
                </div>

                <div className="devices-borrow-actions">
                  <button
                    type="button"
                    onClick={() =>
                      act(() => devicesApi.approveBorrow(borrow.id), "审批通过")
                    }
                  >
                    审批
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      act(
                        () => devicesApi.rejectBorrow(borrow.id, "不符合要求"),
                        "已拒绝",
                      )
                    }
                  >
                    拒绝
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      act(() => devicesApi.checkoutBorrow(borrow.id), "已确认借出")
                    }
                  >
                    借出
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      act(() => devicesApi.returnBorrow(borrow.id), "已确认归还")
                    }
                  >
                    归还
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() =>
                      act(() => devicesApi.cancelBorrow(borrow.id, "取消"), "已取消")
                    }
                  >
                    取消
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing ? (
        <div className="modal-mask">
          <div className="modal-card devices-modal-card">
            <h3>编辑设备</h3>

            <label className="devices-field">
              <span>设备名称</span>
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>

            <div className="devices-modal-grid">
              <label className="devices-field">
                <span>设备类别</span>
                <input
                  value={editing.category || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                />
              </label>

              <label className="devices-field">
                <span>库存数量</span>
                <input
                  type="number"
                  min={1}
                  value={editing.quantity || 1}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>

            <label className="devices-field">
              <span>存放位置</span>
              <input
                value={editing.location || ""}
                onChange={(e) =>
                  setEditing({ ...editing, location: e.target.value })
                }
              />
            </label>

            <label className="devices-field">
              <span>说明</span>
              <input
                value={editing.description || ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </label>

            <label className="devices-field">
              <span>设备状态</span>
              <select
                value={editing.status || "available"}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
              >
                <option value="available">可借</option>
                <option value="borrowed">借出中</option>
                <option value="maintenance">维修中</option>
                <option value="disabled">停用</option>
              </select>
            </label>

            <div className="btn-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(null)}
              >
                取消
              </button>
              <button type="button" onClick={saveDevice}>
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleting ? (
        <div className="modal-mask">
          <div className="modal-card devices-modal-card">
            <h3>确认删除</h3>
            <p>确定删除设备「{deleting.name}」吗？</p>

            <div className="btn-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleting(null)}
              >
                取消
              </button>
              <button type="button" className="btn-danger" onClick={deleteDevice}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
