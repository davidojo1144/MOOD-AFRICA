import type { Post } from '@/types/post';

import { apiClient } from './client';

export const postsService = {
  async list(limit = 10): Promise<Post[]> {
    const { data } = await apiClient.get<Post[]>('/posts', { params: { _limit: limit } });
    return data;
  },

  async get(id: number): Promise<Post> {
    const { data } = await apiClient.get<Post>(`/posts/${id}`);
    return data;
  },
};
