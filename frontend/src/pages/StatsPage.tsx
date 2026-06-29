import { useEffect, useMemo, useState } from "react";

import { statsApi } from "../api/stats";
import ApiError from "../components/ApiError";
import {
  EmptyState,
  PageHeader,
  ProgressRing,
  ResourceCard,
  StatCard,
  StatusChip,
} from "../components/ui";

import "../styles/stats.css";

type ActivityCollegeRow = {
  college: string;
  activity_count?: number;
  venue_reservation_count?: number;
  equipment_borrow_count?: number;
  task_count?: number;
  completed_task_count?: number;
  task_completion_rate?: number;
};

type UserCollegeRow = {
  college: string;
  user_count?: number;
  joined_activity_count?: number;
  assigned_task_count?: number;
  completed_task_count?: number;
  progress_log_count?: number;
};

type CollegeStatsData = {
  by_activity_college?: ActivityCollegeRow[];
  by_user_college?: UserCollegeRow[];
};

function pct(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return `${n.toFixed(1)}%`;
}

function numberText(value?: number) {
  return (value || 0).toLocaleString("zh-CN");
}

function clampPercent(value?: number) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function maxOf<T>(items: T[], pick: (item: T) => number | undefined) {
  return Math.max(1, ...items.map((item) => pick(item) || 0));
}

function completionTone(rate?: number) {
  const value = rate || 0;
  if (value >= 80) return "success";
  if (value >= 40) return "warning";
  return "info";
}

export default function StatsPage() {
  const [data, setData] = useState<CollegeStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      try {
        setData((await statsApi.colleges()) as CollegeStatsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byActivity = data?.by_activity_college || [];
  const byUser = data?.by_user_college || [];

  const summary = useMemo(() => {
    const collegeSet = new Set<string>();

    byActivity.forEach((row) => collegeSet.add(row.college));
    byUser.forEach((row) => collegeSet.add(row.college));

    const activityCount = byActivity.reduce(
      (total, row) => total + (row.activity_count || 0),
      0,
    );
    const taskCount = byActivity.reduce(
      (total, row) => total + (row.task_count || 0),
      0,
    );
    const doneCount = byActivity.reduce(
      (total, row) => total + (row.completed_task_count || 0),
      0,
    );
    const venueCount = byActivity.reduce(
      (total, row) => total + (row.venue_reservation_count || 0),
      0,
    );
    const deviceCount = byActivity.reduce(
      (total, row) => total + (row.equipment_borrow_count || 0),
      0,
    );

    return {
      collegeCount: collegeSet.size,
      activityCount,
      taskCount,
      doneCount,
      resourceCount: venueCount + deviceCount,
      completionRate: taskCount > 0 ? (doneCount * 100) / taskCount : 0,
      users: byUser.reduce((total, row) => total + (row.user_count || 0), 0),
      progressLogs: byUser.reduce(
        (total, row) => total + (row.progress_log_count || 0),
        0,
      ),
    };
  }, [byActivity, byUser]);

  const maxActivityCount = maxOf(byActivity, (row) => row.activity_count);
  const maxUserCount = maxOf(byUser, (row) => row.user_count);

  const hasStats = byActivity.length > 0 || byUser.length > 0;

  return (
    <section className="stats-page page-stack">
      <PageHeader
        eyebrow="Analytics"
        title="数据统计"
        description="查看学院活动、资源使用和任务完成情况。"
        actions={<StatusChip tone="info">{summary.collegeCount} 个学院/书院</StatusChip>}
      />

      <ApiError error={error} />
      {loading ? <div className="loading">数据统计加载中...</div> : null}

      {!loading && !hasStats ? (
        <EmptyState
          icon="S"
          title="暂无统计数据"
          description="创建活动、任务或资源申请后，统计结果会显示在这里。"
        />
      ) : null}

      {hasStats ? (
        <>
          <div className="stats-metric-grid">
            <StatCard
              label="学院 / 书院总数"
              value={numberText(summary.collegeCount)}
              description="活动或成员统计中出现的归属"
              icon="C"
              tone="cyan"
            />
            <StatCard
              label="活动总数"
              value={numberText(summary.activityCount)}
              description="按活动归属聚合"
              icon="A"
              tone="blue"
            />
            <StatCard
              label="资源使用次数"
              value={numberText(summary.resourceCount)}
              description="场地预约 + 设备借用"
              icon="R"
              tone="violet"
            />
            <StatCard
              label="成员数量"
              value={numberText(summary.users)}
              description={`进度提交 ${numberText(summary.progressLogs)} 条`}
              icon="U"
              tone="green"
            />
            <div className="stats-rate-card">
              <ProgressRing
                value={summary.doneCount}
                max={summary.taskCount}
                label={pct(summary.completionRate)}
                caption="任务完成率"
                tone={summary.completionRate >= 75 ? "green" : "amber"}
                size={124}
              />
            </div>
          </div>

          <div className="stats-dashboard-grid">
            <section className="stats-panel stats-activity-panel">
              <div className="stats-section-heading">
                <div>
                  <h2>活动归属统计</h2>
                  <p>按学院 / 书院展示活动、资源申请与任务完成情况。</p>
                </div>
                <StatusChip tone="info">{byActivity.length} 项</StatusChip>
              </div>

              {byActivity.length === 0 ? (
                <EmptyState
                  icon="A"
                  title="暂无活动归属统计"
                  description="创建带学院/书院信息的活动后，这里会显示统计。"
                />
              ) : (
                <div className="stats-bar-list">
                  {byActivity.map((row) => {
                    const activityPercent =
                      ((row.activity_count || 0) / maxActivityCount) * 100;
                    const completion = clampPercent(row.task_completion_rate);

                    return (
                      <article className="stats-bar-card" key={row.college}>
                        <div className="stats-bar-head">
                          <div>
                            <h3>{row.college}</h3>
                            <p>
                              活动 {numberText(row.activity_count)} / 场地{" "}
                              {numberText(row.venue_reservation_count)} / 设备{" "}
                              {numberText(row.equipment_borrow_count)}
                            </p>
                          </div>
                          <StatusChip tone={completionTone(completion)}>
                            完成率 {pct(completion)}
                          </StatusChip>
                        </div>

                        <div className="stats-bars">
                          <div>
                            <span>活动数量</span>
                            <div className="stats-track">
                              <div style={{ width: `${activityPercent}%` }} />
                            </div>
                            <strong>{numberText(row.activity_count)}</strong>
                          </div>
                          <div>
                            <span>任务完成</span>
                            <div className="stats-track stats-track-success">
                              <div style={{ width: `${completion}%` }} />
                            </div>
                            <strong>
                              {numberText(row.completed_task_count)} /{" "}
                              {numberText(row.task_count)}
                            </strong>
                          </div>
                        </div>

                        <div className="stats-mini-grid">
                          <div>
                            <span>场地预约</span>
                            <strong>{numberText(row.venue_reservation_count)}</strong>
                          </div>
                          <div>
                            <span>设备借用</span>
                            <strong>{numberText(row.equipment_borrow_count)}</strong>
                          </div>
                          <div>
                            <span>任务数量</span>
                            <strong>{numberText(row.task_count)}</strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="stats-panel">
              <div className="stats-section-heading">
                <div>
                  <h2>资源使用结构</h2>
                  <p>基于当前学院活动统计中的场地预约和设备借用数量。</p>
                </div>
              </div>

              <div className="stats-resource-grid">
                {byActivity.slice(0, 6).map((row) => {
                  const resourceTotal =
                    (row.venue_reservation_count || 0) +
                    (row.equipment_borrow_count || 0);
                  const venuePercent =
                    resourceTotal > 0
                      ? ((row.venue_reservation_count || 0) / resourceTotal) * 100
                      : 0;

                  return (
                    <ResourceCard
                      key={`resource-${row.college}`}
                      title={row.college}
                      description={`资源使用 ${numberText(resourceTotal)} 次`}
                      icon="R"
                      tone="violet"
                      meta={
                        <StatusChip tone={resourceTotal > 0 ? "info" : "neutral"}>
                          {resourceTotal > 0 ? "有资源记录" : "暂无资源记录"}
                        </StatusChip>
                      }
                    >
                      <div className="stats-resource-split">
                        <div className="stats-track">
                          <div style={{ width: `${venuePercent}%` }} />
                        </div>
                        <div>
                          <span>场地 {numberText(row.venue_reservation_count)}</span>
                          <span>设备 {numberText(row.equipment_borrow_count)}</span>
                        </div>
                      </div>
                    </ResourceCard>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="stats-panel">
            <div className="stats-section-heading">
              <div>
                <h2>成员参与度统计</h2>
                <p>按成员所属学院 / 书院展示参与活动、任务分配和进度提交。</p>
              </div>
              <StatusChip tone="info">{byUser.length} 项</StatusChip>
            </div>

            {byUser.length === 0 ? (
              <EmptyState
                icon="U"
                title="暂无成员归属统计"
                description="完善用户学院 / 书院信息后，这里会显示统计。"
              />
            ) : (
              <div className="stats-member-grid">
                {byUser.map((row) => {
                  const userPercent = ((row.user_count || 0) / maxUserCount) * 100;
                  const taskRate =
                    row.assigned_task_count && row.assigned_task_count > 0
                      ? ((row.completed_task_count || 0) * 100) /
                        row.assigned_task_count
                      : 0;

                  return (
                    <article className="stats-member-card" key={row.college}>
                      <div className="stats-member-head">
                        <div>
                          <h3>{row.college}</h3>
                          <p>{numberText(row.user_count)} 名用户</p>
                        </div>
                        <StatusChip tone={completionTone(taskRate)}>
                          任务完成 {pct(taskRate)}
                        </StatusChip>
                      </div>

                      <div className="stats-bars">
                        <div>
                          <span>用户规模</span>
                          <div className="stats-track">
                            <div style={{ width: `${userPercent}%` }} />
                          </div>
                          <strong>{numberText(row.user_count)}</strong>
                        </div>
                        <div>
                          <span>任务完成</span>
                          <div className="stats-track stats-track-success">
                            <div style={{ width: `${clampPercent(taskRate)}%` }} />
                          </div>
                          <strong>
                            {numberText(row.completed_task_count)} /{" "}
                            {numberText(row.assigned_task_count)}
                          </strong>
                        </div>
                      </div>

                      <div className="stats-mini-grid">
                        <div>
                          <span>参与活动</span>
                          <strong>{numberText(row.joined_activity_count)}</strong>
                        </div>
                        <div>
                          <span>被分配任务</span>
                          <strong>{numberText(row.assigned_task_count)}</strong>
                        </div>
                        <div>
                          <span>提交进度</span>
                          <strong>{numberText(row.progress_log_count)}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
