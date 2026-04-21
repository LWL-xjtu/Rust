import { apiClient } from './apiClient';
import type { Tag, CreateTag, UpdateTag } from '../types';

export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    return apiClient.get<Tag[]>('/tags');
  },

  getTag: async (id: number): Promise<Tag> => {
    return apiClient.get<Tag>(`/tags/${id}`);
  },

  createTag: async (tagData: CreateTag): Promise<Tag> => {
    return apiClient.post<Tag>('/tags', tagData);
  },

  updateTag: async (id: number, tagData: UpdateTag): Promise<Tag> => {
    return apiClient.put<Tag>(`/tags/${id}`, tagData);
  },

  deleteTag: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/tags/${id}`);
  },
};