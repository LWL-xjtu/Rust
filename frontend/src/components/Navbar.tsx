import { useNavigate } from "react-router-dom";

import { authApi } from "../api/auth";

export default function Navbar() {
  const nav = useNavigate();

  const handleLogout = () => {
    authApi.logout();
    nav("/login");
  };

  return (
    <header className="navbar">
      <div>
        <div className="page-eyebrow">CONSOLE</div>
        <div className="navbar-title">校园活动管理系统</div>
      </div>

      <div className="navbar-actions">
        <div className="navbar-status">
          <span className="status-dot" />
          服务在线
        </div>

        <button type="button" className="navbar-logout" onClick={handleLogout}>
          退出登录
        </button>
      </div>
    </header>
  );
}
