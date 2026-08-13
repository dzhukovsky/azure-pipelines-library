import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useEffect, useMemo } from 'react';
import { useMatrixViews } from '@/features/matrix-views/hooks/useMatrixViews';
import type { QueryParamsSetter } from '@/shared/hooks/useNavigation';
import { HomeTab } from './HomeTab';
import type { LibraryTabModel } from './LibraryTabModel';
import { MatrixTab } from './MatrixTab';

export const useTabs = (
  tab: string,
  setQueryParams: QueryParamsSetter<{ tab: string }>,
  filter: IFilter,
  onTabContextChange: (model: LibraryTabModel | undefined) => void,
  showComparison: boolean,
) => {
  tab = tab?.toLowerCase() || 'home';

  const { data: views, isLoading: viewsLoading } = useMatrixViews();

  const tabs = useMemo<
    Record<string, { name: string; render: () => React.ReactNode }>
  >(() => {
    const result: Record<
      string,
      { name: string; render: () => React.ReactNode }
    > = {
      home: {
        name: 'Home',
        render: () => (
          <HomeTab filter={filter} onTabContextChange={onTabContextChange} />
        ),
      },
    };

    for (const view of views ?? []) {
      result[view.id.toLowerCase()] = {
        name: view.name,
        // Keyed per view: MatrixTab initializes its data provider from props
        // at mount, so switching between two matrix views must remount it.
        render: () => (
          <MatrixTab
            key={view.id}
            filter={filter}
            groupIds={view.groupIds}
            groupingPatterns={view.groupingPatterns}
            showComparison={showComparison}
            onTabContextChange={onTabContextChange}
          />
        ),
      };
    }

    return result;
  }, [filter, onTabContextChange, views, showComparison]);

  const currentTab = tabs[tab];

  // An unknown tab id (deleted view, hand-edited url) falls back to Home once
  // the view list has loaded. Effect, not render: this navigates.
  useEffect(() => {
    if (!currentTab && !viewsLoading) {
      setQueryParams({ tab: '' });
    }
  }, [currentTab, viewsLoading, setQueryParams]);

  return {
    currentTab,
    tabs: Object.entries(tabs).map(([id, tab]) => ({ id, ...tab })),
  };
};
