import { apiClient, clearToken, setToken } from "./client";
import type { User } from "./types";

export type LoginResponse = { token: string; user: User };

export const authApi = {
  register: (username: string, password: string) =>
    apiClient.post<User>("/api/auth/register", { username, password }),
  login: async (username: string, password: string) => {
    const data = await apiClient.post<LoginResponse>("/api/auth/login", { username, password });
    setToken(data.token);
    return data;
  },
  me: () => apiClient.get<User>("/api/users/me"),
  logout: () => clearToken(),
};
