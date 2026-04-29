import { apiClient } from "./client";

export const devicesApi = {
  listDevices: () => apiClient.get<any[]>("/api/devices"),
  createDevice: (payload: any) => apiClient.post<any>("/api/devices", payload),
  getDevice: (id: string) => apiClient.get<any>(`/api/devices/${id}`),
  updateDevice: (id: string, payload: any) => apiClient.put<any>(`/api/devices/${id}`, payload),
  deleteDevice: (id: string) => apiClient.delete<void>(`/api/devices/${id}`),
  createBorrow: (payload: any) => apiClient.post<any>("/api/device-borrows", payload),
  listBorrows: () => apiClient.get<any[]>("/api/device-borrows"),
  approveBorrow: (id: string) => apiClient.post<any>(`/api/device-borrows/${id}/approve`),
  rejectBorrow: (id: string, remark?: string) => apiClient.post<any>(`/api/device-borrows/${id}/reject`, { remark }),
  checkoutBorrow: (id: string) => apiClient.post<any>(`/api/device-borrows/${id}/checkout`),
  returnBorrow: (id: string) => apiClient.post<any>(`/api/device-borrows/${id}/return`),
  cancelBorrow: (id: string, remark?: string) => apiClient.post<any>(`/api/device-borrows/${id}/cancel`, { remark }),
};
