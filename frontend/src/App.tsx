import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

import { authApi } from "./api/auth";
import type { User } from "./api/types";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import VenuesPage from "./pages/VenuesPage";
import DevicesPage from "./pages/DevicesPage";
import TasksPage from "./pages/TasksPage";
import LogsPage from "./pages/LogsPage";
import StatsPage from "./pages/StatsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      try {
        const user = (await authApi.me()) as User;

        if (!mounted) return;

        setAllowed(allowedRoles.includes(user.role));
        setFailed(false);
      } catch {
        if (!mounted) return;

        setAllowed(false);
        setFailed(true);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void checkRole();

    return () => {
      mounted = false;
    };
  }, [allowedRoles]);

  if (loading) {
    return <div className="loading">权限校验中...</div>;
  }

  if (failed) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />

                  <Route path="/activities" element={<ActivitiesPage />} />

                  <Route
                    path="/activities/:id"
                    element={<ActivityDetailPage />}
                  />

                  <Route path="/venues" element={<VenuesPage />} />

                  <Route path="/devices" element={<DevicesPage />} />

                  <Route path="/tasks" element={<TasksPage />} />

                  <Route
                    path="/logs"
                    element={
                      <RoleGuard allowedRoles={["teacher", "admin"]}>
                        <LogsPage />
                      </RoleGuard>
                    }
                  />

                  <Route
                    path="/stats"
                    element={
                      <RoleGuard allowedRoles={["teacher", "admin"]}>
                        <StatsPage />
                      </RoleGuard>
                    }
                  />

                  <Route
                    path="/admin/users"
                    element={
                      <RoleGuard allowedRoles={["admin"]}>
                        <AdminUsersPage />
                      </RoleGuard>
                    }
                  />

                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}
