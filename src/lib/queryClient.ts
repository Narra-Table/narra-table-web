import { QueryCache, QueryClient } from '@tanstack/react-query';
import { clearAuth } from './auth';
import { ApiError } from './orvalClient';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        clearAuth();
        queryClient.clear();
        window.location.replace('/login');
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
