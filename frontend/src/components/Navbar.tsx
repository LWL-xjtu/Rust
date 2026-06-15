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
      <div className="brand">校园协作系统</div>

      <nav>
        <button type="button" onClick={handleLogout}>
          退出登录
        </button>
      </nav>
    </header>
  );
}
