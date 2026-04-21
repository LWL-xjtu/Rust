import { apiClient } from './apiClient';
import type { Category, CreateCategory, UpdateCategory } from '../types';

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/categories');
  },

  getCategory: async (id: number): Promise<Category> => {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  createCategory: async (categoryData: CreateCategory): Promise<Category> => {
    return apiClient.post<Category>('/categories', categoryData);
  },

  updateCategory: async (id: number, categoryData: UpdateCategory): Promise<Category> => {
    return apiClient.put<Category>(`/categories/${id}`, categoryData);
  },

  deleteCategory: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/categories/${id}`);
  },
};