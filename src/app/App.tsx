import 'azure-devops-ui/Core/override.css';
import '@/shared/styles/icons.scss';

import * as SDK from 'azure-devops-extension-sdk';
import { useEffect, useState } from 'react';
import { loadConfigurations } from '@/hooks/query/configurations';
import { LibraryPage } from '@/pages/library';
import { Providers } from './providers';

export const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      SDK.init({ loaded: false });
      await loadConfigurations();
      await document.fonts.ready;
      SDK.notifyLoadSucceeded();
      setReady(true);
    };
    init();
  }, []);

  if (!ready) return null;

  return (
    <Providers>
      <LibraryPage />
    </Providers>
  );
};
