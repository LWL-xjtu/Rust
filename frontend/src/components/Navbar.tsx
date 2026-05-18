import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";

export default function Navbar() {
  const nav = useNavigate();
  return (
    <header className="navbar">
      <div className="brand">校园协作系统</div>
      <nav>
        <Link to="/dashboard">仪表盘</Link>
        <Link to="/activities">活动管理</Link>
        <Link to="/venues">场地预约</Link>
        <Link to="/devices">设备借用</Link>
        <Link to="/tasks">任务分工</Link>
        <Link to="/logs">操作日志</Link>
        <Link to="/stats">数据统计</Link>
      </nav>
      <button
        onClick={() => {
          authApi.logout();
          nav("/login");
        }}
      >
        退出登录
      </button>
    </header>
  );
}
