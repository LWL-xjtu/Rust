import { apiClient } from "./client";

export const adminApi = {
  users: () => apiClient.get<any[]>("/api/admin/users"),
  updateRole: (id: string, role: string) => apiClient.put<any>(`/api/admin/users/${id}/role`, { role }),
  updateStatus: (id: string, is_active: boolean) =>
    apiClient.put<any>(`/api/admin/users/${id}/status`, { is_active }),
  updateCollege: (id: string, college: string) =>
    apiClient.put<any>(`/api/admin/users/${id}/college`, { college }),
};
