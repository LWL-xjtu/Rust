import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
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
                  <Route path="/activities/:id" element={<ActivityDetailPage />} />
                  <Route path="/venues" element={<VenuesPage />} />
                  <Route path="/devices" element={<DevicesPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/logs" element={<LogsPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}
