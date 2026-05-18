import { useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { logsApi } from "../api/logs";
import { statsApi } from "../api/stats";
import ApiError from "../components/ApiError";
import Loading from "../components/Loading";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [u, s] = await Promise.all([authApi.me(), statsApi.overview()]);
        setMe(u);
        setOverview(s);
        try {
          setLogs(await logsApi.list());
        } catch {
          setLogs([]);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <h2>Dashboard</h2>
      <ApiError error={error} />
      <p>
        当前用户：<b>{me?.username || "-"}</b>（<span className={`status status-${me?.role || "student"}`}>{me?.role || "-"}</span>）
      </p>
      <div className="cards">
        <div>活动总数: {overview?.activities_count ?? "-"}</div>
        <div>场地预约数: {overview?.venue_bookings_count ?? "-"}</div>
        <div>设备借用数: {overview?.device_borrows_count ?? "-"}</div>
        <div>任务总数: {overview?.tasks_count ?? "-"}</div>
        <div>已完成任务: {overview?.tasks_done_count ?? "-"}</div>
        <div>用户总数: {overview?.users_count ?? "-"}</div>
      </div>
      <h3>最近操作日志（管理员可见）</h3>
      <ul>{logs.slice(0, 10).map((l) => <li key={l.id}>{l.created_at} | {l.summary}</li>)}</ul>
    </div>
  );
}
