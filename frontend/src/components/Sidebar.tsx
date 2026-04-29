import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/dashboard">仪表盘</NavLink>
      <NavLink to="/activities">活动管理</NavLink>
      <NavLink to="/venues">场地预约</NavLink>
      <NavLink to="/devices">设备借用</NavLink>
      <NavLink to="/tasks">任务分工</NavLink>
      <NavLink to="/logs">操作日志</NavLink>
      <NavLink to="/stats">统计</NavLink>
    </aside>
  );
}
