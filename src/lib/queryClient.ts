import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { clearAdminSession } from './adminAuth';
import { AdminApiError } from './adminClient';
import { adminRootQuery } from './adminQueries';
import { clearAuth } from './auth';
import { ApiError } from './orvalClient';

function handleUnauthorized(error: unknown) {
  if (error instanceof AdminApiError && error.status === 401) {
    clearAdminSession();
    queryClient.removeQueries({ queryKey: adminRootQuery.queryKey });
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
