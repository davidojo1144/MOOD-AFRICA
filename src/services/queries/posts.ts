import { useQuery } from '@tanstack/react-query';

import { postsService } from '@/services/api';

export const postKeys = {
  all: ['posts'] as const,
  list: (limit: number) => [...postKeys.all, 'list', limit] as const,
  detail: (id: number) => [...postKeys.all, 'detail', id] as const,
};

export function usePosts(limit = 5) {
  return useQuery({
    queryKey: postKeys.list(limit),
    queryFn: () => postsService.list(limit),
  });
}
