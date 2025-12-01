import './library.scss';

import { Button } from 'azure-devops-ui/Button';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import { Header, TitleSize } from 'azure-devops-ui/Header';
import type { IHeaderCommandBarItem } from 'azure-devops-ui/HeaderCommandBar';
import { Page } from 'azure-devops-ui/Page';
import { SplitButton } from 'azure-devops-ui/SplitButton';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { Tab, TabBar } from 'azure-devops-ui/Tabs';
import { InlineKeywordFilterBarItem } from 'azure-devops-ui/TextFilterBarItem';
import { Filter, type IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PreviewChangesDialog,
  type PreviewChangesDialogOptions,
} from '@/components/Dialogs/PreviewChangesDialog';
import { States } from '@/components/shared/State';
import { HomeTab } from '@/components/Tabs/HomeTab';
import { MatrixTab } from '@/components/Tabs/MatrixTab';
import { useFilterSubscription } from '@/hooks/filtering';
import { getProjectUrl } from '@/hooks/query/configurations';
import {
  navigateTo,
  type QueryParamsSetter,
  useNavigationService,
} from '@/hooks/query/navigation';
import { ObservableObjectArray } from '@/models/Observable/ObservableObjectArray';
import { ObservableSecureFile } from '@/models/SecureFile';
import type { HomeTabModel } from '@/models/tabs/HomeTabModel';
import { ObservableVariableGroup } from '@/models/VariableGroup';

export const LibraryPage = () => {
  const { queryParams, isLoading, setQueryParams } = useNavigationService({
    tab: 'home',
    filter: '',
  });

  const previewDialogOptions = useMemo(
    () =>
      new ObservableValue<PreviewChangesDialogOptions | undefined>(undefined),
    [],
  );

  const filter = useFilter(queryParams.filter, setQueryParams);
  const { headerCommands, renderTabBarCommands, onTabContextChange } =
    useHeader(filter, previewDialogOptions);
  const { currentTab, tabs } = useTabs(
    queryParams.tab,
    setQueryParams,
    filter,
    onTabContextChange,
  );

  if (isLoading) {
    return <div></div>;
  }

  return (
    <>
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
      <PreviewChangesDialog options={previewDialogOptions} />
    </>
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

  useEffect(() => {
    if (filter.getFilterItemValue('keyword') !== defaultValue) {
      filter.setFilterItemState('keyword', { value: defaultValue });
    }
  }, [defaultValue, filter]);

  const onFilterChange = useCallback(() => {
    setQueryParams(
      { filter: filter.getFilterItemValue('keyword') ?? '' },
      false,
    );
  }, [filter, setQueryParams]);

  useFilterSubscription(filter, onFilterChange);

  return filter;
};

const useTabs = (
  tab: string,
  setQueryParams: QueryParamsSetter<{ tab: string }>,
  filter: IFilter,
  onTabContextChange: (tab: HomeTabModel) => void,
) => {
  tab = tab?.toLowerCase() || 'home';

  const tabs = useMemo<
    Record<string, { name: string; render: () => React.ReactNode }>
  >(
    () => ({
      home: {
        name: 'Home',
        render: () => (
          <HomeTab filter={filter} onTabContextChange={onTabContextChange} />
        ),
      },
      matrix: {
        name: 'Matrix',
        render: () => <MatrixTab filter={filter} />,
      },
    }),
    [filter, onTabContextChange],
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

const useHeader = (
  filter: IFilter,
  previewDialogOptions: ObservableValue<
    PreviewChangesDialogOptions | undefined
  >,
) => {
  const getHasChangesCommands = useCallback(
    (model: HomeTabModel): IHeaderCommandBarItem[] => [
      {
        id: 'preview-changes',
        important: true,
        renderButton: ({ id }) => (
          <Button
            key={id}
            primary={true}
            text="Preview changes"
            onClick={() => {
              previewDialogOptions.value = {
                variableGroups: model.variableGroups,
                secureFiles: model.secureFiles,
              };
            }}
          />
        ),
      },
      {
        id: 'discard-changes',
        text: 'Discard changes',
        onActivate: () => {
          alert('Discard changes');
        },
        important: false,
      },
    ],
    [previewDialogOptions],
  );

  const noChangesCommands: IHeaderCommandBarItem[] = useMemo(
    () => [
      {
        id: 'new-variable-group',
        important: true,
        renderButton: ({ id }) => (
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
    [],
  );

  const [headerCommands, setHeaderCommands] =
    useState<IHeaderCommandBarItem[]>(noChangesCommands);

  const onTabContextChange = useCallback(
    (model: HomeTabModel) =>
      setHeaderCommands(
        model.modified ? getHasChangesCommands(model) : noChangesCommands,
      ),
    [noChangesCommands, getHasChangesCommands],
  );

  const renderTabBarCommands = useCallback(
    () => (
      <InlineKeywordFilterBarItem filter={filter} filterItemKey="keyword" />
    ),
    [filter],
  );

  return {
    headerCommands,
    renderTabBarCommands,
    onTabContextChange,
  };
};
