import { useEffect, useMemo, useState } from "react";
import { statsApi } from "../api/stats";
import ApiError from "../components/ApiError";

function pct(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(2)}%`;
}

export default function StatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setData(await statsApi.colleges());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => {
    const byActivity = data?.by_activity_college || [];
    const collegeCount = byActivity.length;
    const activityCount = byActivity.reduce((n: number, r: any) => n + (r.activity_count || 0), 0);
    const taskCount = byActivity.reduce((n: number, r: any) => n + (r.task_count || 0), 0);
    const doneCount = byActivity.reduce((n: number, r: any) => n + (r.completed_task_count || 0), 0);
    const resourceCount = byActivity.reduce(
      (n: number, r: any) => n + (r.venue_reservation_count || 0) + (r.equipment_borrow_count || 0),
      0,
    );
    return {
      collegeCount,
      activityCount,
      resourceCount,
      completionRate: taskCount > 0 ? (doneCount * 100) / taskCount : 0,
    };
  }, [data]);

  return (
    <div>
      <h2>学院/书院统计</h2>
      <ApiError error={error} />

      {loading ? <p>加载中...</p> : null}

      <div className="cards">
        <div>学院/书院总数：{summary.collegeCount}</div>
        <div>活动总数：{summary.activityCount}</div>
        <div>任务完成率：{pct(summary.completionRate)}</div>
        <div>资源使用次数：{summary.resourceCount}</div>
      </div>

      <div className="panel">
        <h3>活动归属统计</h3>
        {data?.by_activity_college?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>学院/书院</th>
                <th>活动数量</th>
                <th>场地预约数量</th>
                <th>设备借用数量</th>
                <th>任务数量</th>
                <th>已完成任务数量</th>
                <th>完成率</th>
              </tr>
            </thead>
            <tbody>
              {data.by_activity_college.map((row: any) => (
                <tr key={`a-${row.college}`}>
                  <td>{row.college}</td>
                  <td>{row.activity_count}</td>
                  <td>{row.venue_reservation_count}</td>
                  <td>{row.equipment_borrow_count}</td>
                  <td>{row.task_count}</td>
                  <td>{row.completed_task_count}</td>
                  <td>
                    <div style={{ background: "#e8edf6", borderRadius: 99, height: 10 }}>
                      <div
                        style={{
                          width: `${Math.min(100, Number(row.task_completion_rate) || 0)}%`,
                          height: 10,
                          borderRadius: 99,
                          background: "#1f6a3f",
                        }}
                      />
                    </div>
                    <small>{pct(Number(row.task_completion_rate))}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>暂无统计数据，请先创建带学院/书院信息的活动。</p>
        )}
      </div>

      <div className="panel">
        <h3>成员归属统计</h3>
        {data?.by_user_college?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>学院/书院</th>
                <th>用户数量</th>
                <th>参与活动数量</th>
                <th>被分配任务数量</th>
                <th>已完成任务数量</th>
                <th>提交进度数量</th>
              </tr>
            </thead>
            <tbody>
              {data.by_user_college.map((row: any) => (
                <tr key={`u-${row.college}`}>
                  <td>{row.college}</td>
                  <td>{row.user_count}</td>
                  <td>{row.joined_activity_count}</td>
                  <td>{row.assigned_task_count}</td>
                  <td>{row.completed_task_count}</td>
                  <td>{row.progress_log_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>暂无统计数据，请先完善用户学院/书院信息。</p>
        )}
      </div>
    </div>
  );
}
