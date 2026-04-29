import { apiClient } from "./client";

export const statsApi = {
  overview: () => apiClient.get<any>("/api/stats/overview"),
  byActivity: (id: string) => apiClient.get<any>(`/api/stats/activities/${id}`),
};
