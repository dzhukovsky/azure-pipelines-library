import 'azure-devops-ui/Core/override.css';
import '@/shared/styles/common.scss';
import '@/shared/styles/icons.scss';

import * as SDK from 'azure-devops-extension-sdk';
import { useEffect, useState } from 'react';
import { LibraryPage } from '@/pages/LibraryPage';
import { initConfigurations } from '@/shared/api/configurations';
import { Providers } from './providers';

export const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      SDK.init({ loaded: false });
      await initConfigurations();
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
