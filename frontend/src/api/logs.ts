import { apiClient } from "./client";

export const logsApi = {
  list: () => apiClient.get<any[]>("/api/operation-logs"),
  byActivity: (id: string) => apiClient.get<any[]>(`/api/activities/${id}/operation-logs`),
};
