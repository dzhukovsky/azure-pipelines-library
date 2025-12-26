import 'azure-devops-ui/Core/override.css';
import './styles/icons.scss';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SDK from 'azure-devops-extension-sdk';
import { SurfaceBackground, SurfaceContext } from 'azure-devops-ui/Surface';
import ReactDOM from 'react-dom';
import { loadConfigurations } from './hooks/query/configurations';
import { LibraryPage } from './pages/library';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

SDK.init({ loaded: false });
await loadConfigurations();
await document.fonts.ready;

ReactDOM.render(
  <SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
    <QueryClientProvider client={queryClient}>
      <LibraryPage />
    </QueryClientProvider>
  </SurfaceContext.Provider>,
  document.getElementById('root'),
);

SDK.notifyLoadSucceeded();
