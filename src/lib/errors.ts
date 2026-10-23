import { isAxiosError } from 'axios';

import type { ApiErrorBody } from '@/types/api';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
