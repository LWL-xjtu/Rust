import { apiClient } from "./client";

export const tasksApi = {
  list: () => apiClient.get<any[]>("/api/tasks"),
  create: (payload: any) => apiClient.post<any>("/api/tasks", payload),
  update: (id: string, payload: any) => apiClient.put<any>(`/api/tasks/${id}`, payload),
  remove: (id: string) => apiClient.delete<void>(`/api/tasks/${id}`),
  updateStatus: (id: string, payload: any) => apiClient.post<any>(`/api/tasks/${id}/status`, payload),
  addProgressLog: (id: string, payload: any) => apiClient.post<any>(`/api/tasks/${id}/progress-logs`, payload),
  getProgressLogs: (id: string) => apiClient.get<any[]>(`/api/tasks/${id}/progress-logs`),
};
