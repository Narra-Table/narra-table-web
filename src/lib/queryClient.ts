import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { clearAdminSession } from './adminAuth';
import { clearAuth } from './auth';
import { ApiError } from './orvalClient';

function handleUnauthorized(error: unknown) {
  if (
    error instanceof Error &&
    error.name === 'AdminApiError' &&
    'status' in error &&
    error.status === 401
  ) {
    clearAdminSession();
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'admin' });
    window.location.replace('/admin/login');
    return;
  }
  if (error instanceof ApiError && error.status === 401) {
    clearAuth();
    queryClient.clear();
    window.location.replace('/login');
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
