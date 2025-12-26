import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SurfaceBackground, SurfaceContext } from 'azure-devops-ui/Surface';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export const Providers = ({ children }: { children: ReactNode }) => (
  <SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </SurfaceContext.Provider>
);
