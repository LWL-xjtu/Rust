import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import { authApi } from "../api/auth";
import type { User } from "../api/types";

type MenuItem = {
  icon: string;
  path: string;
  label: string;
  description: string;
  allowedRoles?: string[];
};

const menuItems: MenuItem[] = [
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
    allowedRoles: ["teacher", "admin"],
  },
  {
    icon: "📈",
    path: "/stats",
    label: "数据统计",
    description: "Analytics",
    allowedRoles: ["teacher", "admin"],
  },
  {
    icon: "👥",
    path: "/admin/users",
    label: "用户与权限",
    description: "Members",
    allowedRoles: ["admin"],
  },
];

function canViewMenu(item: MenuItem, role?: string) {
  if (!item.allowedRoles) return true;
  if (!role) return false;

  return item.allowedRoles.includes(role);
}

export default function Sidebar() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const user = await authApi.me();

        if (mounted) {
          setCurrentUser(user as User);
        }
      } catch {
        if (mounted) {
          setCurrentUser(null);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleMenuItems = useMemo(() => {
    return menuItems.filter((item) => canViewMenu(item, currentUser?.role));
  }, [currentUser?.role]);

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
        {visibleMenuItems.map((item) => (
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
        <div className="sidebar-footer-value">
          {currentUser
            ? `${currentUser.username} · ${currentUser.role}`
            : "Campus Collaboration"}
        </div>
      </div>
    </aside>
  );
}
