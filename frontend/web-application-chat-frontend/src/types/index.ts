// Ré-exporter tous les types
export * from './auth.types';
export * from './user.types';
export * from './chat.types';
// export * from './message.types';
// export * from './websocket.types';

// Types communs
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  timestamp: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}