import { apiClient } from './apiClient';
import type { Task, CreateTask, UpdateTask } from '../types';

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    return apiClient.get<Task[]>('/task');
  },

  getTask: async (id: number): Promise<Task> => {
    return apiClient.get<Task>(`/task/${id}`);
  },

  createTask: async (taskData: CreateTask): Promise<Task> => {
    return apiClient.post<Task>('/task', taskData);
  },

  updateTask: async (id: number, taskData: UpdateTask): Promise<Task> => {
    return apiClient.put<Task>(`/task/${id}`, taskData);
  },

  deleteTask: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/task/${id}`);
  },
};