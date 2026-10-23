export type ApiErrorBody = {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
};

export type Paginated<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};
