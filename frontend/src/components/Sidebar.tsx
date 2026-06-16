import { NavLink } from "react-router-dom";

const menuItems = [
  {
    icon: "📊",
    path: "/dashboard",
    label: "仪表盘",
    description: "Overview",
  },
  {
    icon: "🎯",
    path: "/activities",
    label: "活动管理",
    description: "Activities",
  },
  {
    icon: "🏫",
    path: "/venues",
    label: "场地预约",
    description: "Venues",
  },
  {
    icon: "💻",
    path: "/devices",
    label: "设备借用",
    description: "Devices",
  },
  {
    icon: "✅",
    path: "/tasks",
    label: "任务分工",
    description: "Tasks",
  },
  {
    icon: "🧾",
    path: "/logs",
    label: "操作日志",
    description: "Usage Logs",
  },
  {
    icon: "📈",
    path: "/stats",
    label: "数据统计",
    description: "Analytics",
  },
  {
    icon: "👥",
    path: "/admin/users",
    label: "用户与权限",
    description: "Members",
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img
            src="/xjtu-logo.png"
            alt="西安交通大学校徽"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <span>XJTU</span>
        </div>

        <div>
          <div className="sidebar-title">校园活动管理系统</div>
          <div className="sidebar-subtitle">activity.console</div>
        </div>
      </div>

      <div className="sidebar-section-title">功能导航</div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>

            <span className="sidebar-link-text">
              <span>{item.label}</span>
              <small>{item.description}</small>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-label">SYSTEM</div>
        <div className="sidebar-footer-value">Campus Collaboration</div>
      </div>
    </aside>
  );
}
