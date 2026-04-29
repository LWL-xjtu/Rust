import { apiClient } from "./client";

export const activitiesApi = {
  list: () => apiClient.get<any[]>("/api/activities"),
  get: (id: string) => apiClient.get<any>(`/api/activities/${id}`),
  create: (payload: any) => apiClient.post<any>("/api/activities", payload),
  update: (id: string, payload: any) => apiClient.put<any>(`/api/activities/${id}`, payload),
  remove: (id: string) => apiClient.delete<void>(`/api/activities/${id}`),
  addMember: (id: string, payload: any) => apiClient.post<any>(`/api/activities/${id}/members`, payload),
  removeMember: (id: string, userId: string) =>
    apiClient.delete<void>(`/api/activities/${id}/members/${userId}`),
  tasks: (id: string) => apiClient.get<any[]>(`/api/activities/${id}/tasks`),
  logs: (id: string) => apiClient.get<any[]>(`/api/activities/${id}/operation-logs`),
};
