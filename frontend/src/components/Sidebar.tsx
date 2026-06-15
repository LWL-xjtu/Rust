import { NavLink } from "react-router-dom";

const menuItems = [
  {
    icon: "📊",
    path: "/dashboard",
    label: "仪表盘",
  },
  {
    icon: "🎯",
    path: "/activities",
    label: "活动管理",
  },
  {
    icon: "🏫",
    path: "/venues",
    label: "场地预约",
  },
  {
    icon: "💻",
    path: "/devices",
    label: "设备借用",
  },
  {
    icon: "✅",
    path: "/tasks",
    label: "任务分工",
  },
  {
    icon: "🧾",
    path: "/logs",
    label: "操作日志",
  },
  {
    icon: "📈",
    path: "/stats",
    label: "数据统计",
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {menuItems.map((item) => (
        <NavLink key={item.path} to={item.path}>
          <span style={{ marginRight: 8 }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}
