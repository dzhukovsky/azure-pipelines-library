import './library.scss';

import { Button } from 'azure-devops-ui/Button';
import { useObservable } from 'azure-devops-ui/Core/Observable';
import { Header, TitleSize } from 'azure-devops-ui/Header';
import type { IHeaderCommandBarItem } from 'azure-devops-ui/HeaderCommandBar';
import { Page } from 'azure-devops-ui/Page';
import { SplitButton } from 'azure-devops-ui/SplitButton';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { Tab, TabBar } from 'azure-devops-ui/Tabs';
import { InlineKeywordFilterBarItem } from 'azure-devops-ui/TextFilterBarItem';
import { Filter, type IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useCallback, useMemo } from 'react';
import { HomeTab } from '@/components/tabs/home/HomeTab';
import { MatrixTab } from '@/components/tabs/MatrixTab';
import { useFilterSubscription } from '@/hooks/filtering';
import { getProjectUrl } from '@/hooks/query/configurations';
import {
  navigateTo,
  type QueryParamsSetter,
  useNavigationService,
} from '@/hooks/query/navigation';

export const LibraryPage = () => {
  const { queryParams, isLoading, setQueryParams } = useNavigationService({
    tab: 'home',
    filter: '',
  });

  const filter = useFilter(queryParams.filter, setQueryParams);
  const { currentTab, tabs } = useTabs(queryParams.tab, setQueryParams, filter);
  const { headerCommands, renderTabBarCommands } = useHeader(filter);

  if (isLoading) {
    return <div></div>;
  }

  return (
    <Surface background={SurfaceBackground.neutral}>
      <Page className="hub-page flex-grow">
        <Header
          title="Library"
          titleSize={TitleSize.Large}
          commandBarItems={headerCommands}
        />
        <TabBar
          selectedTabId={queryParams.tab}
          onSelectedTabChanged={(tab) => setQueryParams({ tab })}
          renderAdditionalContent={renderTabBarCommands}
          disableSticky={false}
        >
          {tabs.map((tab) => (
            <Tab key={tab.id} id={tab.id} name={tab.name} />
          ))}
        </TabBar>
        <div className="page-content page-content-top">
          {currentTab?.render()}
        </div>
      </Page>
    </Surface>
  );
};

const useFilter = (
  defaultValue: string,
  setQueryParams: QueryParamsSetter<{ filter: string }>,
) => {
  const filter = useMemo(
    () => new Filter({ defaultState: { keyword: { value: defaultValue } } }),
    [defaultValue],
  );

  if (filter.getFilterItemValue('keyword') !== defaultValue) {
    filter.setFilterItemState('keyword', { value: defaultValue });
  }

  useFilterSubscription(filter, () => {
    setQueryParams(
      { filter: filter.getFilterItemValue('keyword') ?? '' },
      false,
    );
  });

  return filter;
};

const useTabs = (
  tab: string,
  setQueryParams: QueryParamsSetter<{ tab: string }>,
  filter: IFilter,
) => {
  tab = tab?.toLowerCase() || 'home';

  const tabs = useMemo<
    Record<string, { name: string; render: () => React.ReactNode }>
  >(
    () => ({
      home: { name: 'Home', render: () => <HomeTab filter={filter} /> },
      matrix: {
        name: 'Matrix',
        render: () => <MatrixTab filter={filter} />,
      },
    }),
    [filter],
  );

  const currentTab = tabs[tab];
  if (!currentTab) {
    setQueryParams({ tab: '' });
  }

  return {
    currentTab,
    tabs: Object.entries(tabs).map(([id, tab]) => ({ id, ...tab })),
  };
};

const useHeader = (filter: IFilter) => {
  const [hasUnsavedChanges] = useObservable(false);
  const headerCommands: IHeaderCommandBarItem[] = useMemo(
    () => [
      {
        id: 'new-variable-group',
        important: true,
        renderButton: hasUnsavedChanges.value
          ? ({ id }) => <Button key={id}>Show changes</Button>
          : ({ id }) => (
              <SplitButton
                key={id}
                primary={true}
                buttonProps={{
                  text: 'New variable group',
                  onClick: () => {
                    navigateTo(
                      `${getProjectUrl()}/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=0`,
                    );
                  },
                }}
                menuButtonProps={{
                  ariaLabel: 'See options',
                  contextualMenuProps: {
                    menuProps: {
                      id: '2',
                      items: [
                        {
                          id: 'new-secure-file',
                          text: 'New secure file',
                          onActivate: () => {
                            navigateTo(
                              `${getProjectUrl()}/_library?itemType=SecureFiles`,
                            );
                          },
                        },
                      ],
                    },
                  },
                }}
              />
            ),
      },
      {
        id: 'history',
        text: 'History',
        onActivate: () => {
          alert('History');
        },
        important: false,
      },
      {
        id: 'manage-views',
        text: 'Manage views',
        onActivate: () => {
          alert('Manage views');
        },
        important: false,
      },
    ],
    [hasUnsavedChanges.value],
  );

  const renderTabBarCommands = useCallback(
    () => (
      <InlineKeywordFilterBarItem filter={filter} filterItemKey="keyword" />
    ),
    [filter],
  );

  return {
    hasUnsavedChanges,
    headerCommands,
    renderTabBarCommands,
  };
};
