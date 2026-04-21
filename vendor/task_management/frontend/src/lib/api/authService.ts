import { apiClient } from './apiClient';
import type { AuthResponse, LoginUser, CreateUser } from '../types';

export const authService = {
  register: async (userData: CreateUser): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/register', userData);
  },

  login: async (credentials: LoginUser): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },
};