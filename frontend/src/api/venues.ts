import { apiClient } from "./client";

export const venuesApi = {
  listVenues: () => apiClient.get<any[]>("/api/venues"),
  createVenue: (payload: any) => apiClient.post<any>("/api/venues", payload),
  updateVenue: (id: string, payload: any) => apiClient.put<any>(`/api/venues/${id}`, payload),
  deleteVenue: (id: string) => apiClient.delete<void>(`/api/venues/${id}`),
  createBooking: (payload: any) => apiClient.post<any>("/api/venue-bookings", payload),
  listBookings: () => apiClient.get<any[]>("/api/venue-bookings"),
  getBooking: (id: string) => apiClient.get<any>(`/api/venue-bookings/${id}`),
  approve: (id: string) => apiClient.post<any>(`/api/venue-bookings/${id}/approve`),
  reject: (id: string, reason?: string) => apiClient.post<any>(`/api/venue-bookings/${id}/reject`, { reason }),
  cancel: (id: string, reason?: string) => apiClient.post<any>(`/api/venue-bookings/${id}/cancel`, { reason }),
};
