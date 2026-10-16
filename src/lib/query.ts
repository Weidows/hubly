import { QueryClient } from '@tanstack/react-query';

/**
 * One query client for the app. HF's public API is rate limited per IP (500 requests / 5 minutes
 * for anonymous callers), so keep requests cached and avoid refetch storms on tab focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500) return false; // 401/403/404/429: do not retry
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
