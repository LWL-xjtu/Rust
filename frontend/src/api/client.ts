import type { ApiResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:7897";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as Record<string, unknown>;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("网络连接失败：请确认后端已启动且 VITE_API_BASE_URL 正确");
  }

  let payload: ApiResponse<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      if (!res.ok) throw new Error(`请求失败（HTTP ${res.status}）`);
      throw new Error("服务返回格式错误，请检查后端响应");
    }
  }

  if (!res.ok) {
    throw new Error(extractMessage(payload, `请求失败（HTTP ${res.status}）`));
  }

  if (!payload) throw new Error("服务返回为空");
  if (payload.code !== 0) throw new Error(payload.message || "请求失败");

  return payload.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
