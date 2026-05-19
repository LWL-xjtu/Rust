export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type User = {
  id: string;
  username: string;
  email?: string | null;
  role: "student" | "teacher" | "admin" | string;
  college?: string | null;
  is_active?: boolean;
  created_at: string;
};
