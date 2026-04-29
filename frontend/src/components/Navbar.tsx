import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";

export default function Navbar() {
  const nav = useNavigate();
  return (
    <header className="navbar">
      <div className="brand">Campus Collab</div>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/activities">Activities</Link>
        <Link to="/venues">Venues</Link>
        <Link to="/devices">Devices</Link>
        <Link to="/tasks">Tasks</Link>
        <Link to="/logs">Logs</Link>
        <Link to="/stats">Stats</Link>
      </nav>
      <button
        onClick={() => {
          authApi.logout();
          nav("/login");
        }}
      >
        Logout
      </button>
    </header>
  );
}
