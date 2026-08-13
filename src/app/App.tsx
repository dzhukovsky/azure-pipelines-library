import 'azure-devops-ui/Core/override.css';
import '@/shared/styles/common.scss';
import '@/shared/styles/icons.scss';

import * as SDK from 'azure-devops-extension-sdk';
import { useEffect, useState } from 'react';
import { initConfigurations } from '@/shared/api/configurations';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { PageRouter } from './PageRouter';
import { Providers } from './providers';

export const App = () => {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<unknown>();

  useEffect(() => {
    const init = async () => {
      SDK.init({ loaded: false });
      await initConfigurations();
      await document.fonts.ready;
      SDK.notifyLoadSucceeded();
      setReady(true);
    };
    init().catch((e) => {
      // Without this the hub would hang on a blank frame and never tell the
      // host it failed to load.
      SDK.notifyLoadFailed(e instanceof Error ? e.message : String(e));
      setInitError(e);
    });
  }, []);

  if (initError) return <ErrorMessage error={initError} />;
  if (!ready) return null;

  return (
    <Providers>
      <PageRouter />
    </Providers>
  );
};
