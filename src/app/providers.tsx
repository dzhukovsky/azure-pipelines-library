import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SurfaceBackground, SurfaceContext } from 'azure-devops-ui/Surface';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Background refetches would rebuild tab models under the user's edits.
      // Freshness is explicit instead: discard, save and the manage-views
      // mutations invalidate the queries they affect.
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

export const Providers = ({ children }: { children: ReactNode }) => (
  <SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </QueryClientProvider>
  </SurfaceContext.Provider>
);
