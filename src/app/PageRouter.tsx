import { LibraryPage } from '@/pages/LibraryPage';
import { useNavigation } from '@/shared/hooks/useNavigation';

// todo: https://github.com/microsoft/azure-devops-extension-sample/tree/master/src/Examples/BreadcrumbService

const routes: Record<string, React.ReactNode> = {
  '': <LibraryPage />,
};

export const PageRouter = () => {
  const { route } = useNavigation({});
  return <>{route === undefined ? <span /> : (routes[route] ?? <span />)}</>;
};
