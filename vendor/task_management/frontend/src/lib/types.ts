export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  completed: boolean;
  category_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTask {
  title: string;
  description: string;
  completed: boolean;
  category_id: number | null;
}

export interface UpdateTask {
  title?: string;
  description?: string;
  completed?: boolean;
  category_id?: number | null;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface CreateCategory {
  name: string;
  description: string;
}

export interface UpdateCategory {
  name?: string;
  description?: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CreateTag {
  name: string;
  color: string;
}

export interface UpdateTag {
  name?: string;
  color?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface CreateUser {
  username: string;
  email: string;
  password: string;
}