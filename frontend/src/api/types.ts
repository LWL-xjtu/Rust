export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type User = {
  id: string;
  username: string;
  role: "student" | "teacher" | "admin" | string;
  college?: string | null;
  created_at: string;
};
