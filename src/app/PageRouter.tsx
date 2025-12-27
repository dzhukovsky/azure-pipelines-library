import { HistoryPage } from '@/pages/HistoryPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useNavigation } from '@/shared/hooks/useNavigation';

// todo: https://github.com/microsoft/azure-devops-extension-sample/tree/master/src/Examples/BreadcrumbService

const routes: Record<string, React.ReactNode> = {
  '': <LibraryPage />,
  history: <HistoryPage />,
  settings: <SettingsPage />,
};

export const PageRouter = () => {
  const { route } = useNavigation({});
  return <>{route === undefined ? <span /> : (routes[route] ?? <span />)}</>;
};
