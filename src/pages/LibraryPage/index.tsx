import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'azure-devops-ui/Button';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import { Dialog } from 'azure-devops-ui/Dialog';
import { Header, TitleSize } from 'azure-devops-ui/Header';
import type { IHeaderCommandBarItem } from 'azure-devops-ui/HeaderCommandBar';
import { Page } from 'azure-devops-ui/Page';
import { SplitButton } from 'azure-devops-ui/SplitButton';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { Tab, TabBar } from 'azure-devops-ui/Tabs';
import { InlineKeywordFilterBarItem } from 'azure-devops-ui/TextFilterBarItem';
import { Filter, type IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HistoryDialog } from '@/features/history/components/HistoryDialog';
import { recordSaveHistory } from '@/features/history/recordSaveHistory';
import { ManageViewsDialog } from '@/features/matrix-views/components/ManageViewsDialog';
import { useMatrixViews } from '@/features/matrix-views/hooks/useMatrixViews';
import {
  PreviewChangesDialog,
  type PreviewChangesDialogOptions,
} from '@/features/preview-changes/components/PreviewChangesDialog';
import { saveLibraryChanges } from '@/features/save-changes/saveLibraryChanges';
import { getProjectUrl } from '@/shared/api/configurations';
import { useFilterSubscription } from '@/shared/components/Table/useFiltering';
import {
  navigateTo,
  type QueryParamsSetter,
  useNavigation,
} from '@/shared/hooks/useNavigation';
import { HomeTab } from './HomeTab';
import type { LibraryTabModel } from './LibraryTabModel';
import { MatrixTab } from './MatrixTab';

export const LibraryPage = () => {
  const { queryParams, isLoading, setQueryParams } = useNavigation({
    tab: 'home',
    filter: '',
  });

  const previewDialogOptions = useMemo(
    () =>
      new ObservableValue<PreviewChangesDialogOptions | undefined>(undefined),
    [],
  );

  const [tabContainerKey, setTabContainerKey] = useState<number>(0);
  const [isManageViewsOpen, setIsManageViewsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string>();

  const openManageViews = useCallback(() => setIsManageViewsOpen(true), []);
  const openHistory = useCallback(() => setIsHistoryOpen(true), []);

  const filter = useFilter(queryParams.filter, setQueryParams);
  const {
    headerCommands,
    renderTabBarCommands,
    registerTabModel,
    hasChanges,
    discardChanges,
  } = useHeader(
    filter,
    setTabContainerKey,
    previewDialogOptions,
    openManageViews,
    openHistory,
  );
  const { currentTab, tabs } = useTabs(
    queryParams.tab,
    setQueryParams,
    filter,
    registerTabModel,
  );

  const onSelectedTabChanged = useCallback(
    (tab: string) => {
      if (tab === queryParams.tab) {
        return;
      }

      if (hasChanges) {
        // Leaving the tab unmounts its model, so confirm before losing edits.
        setPendingTab(tab);
        return;
      }

      setQueryParams({ tab });
    },
    [hasChanges, queryParams.tab, setQueryParams],
  );

  if (isLoading) {
    return <div></div>;
  }

  return (
    <>
      <Surface background={SurfaceBackground.neutral}>
        <Page className="height-100vh flex-grow">
          <Header
            title="Advanced Library"
            titleSize={TitleSize.Large}
            commandBarItems={headerCommands}
          />
          <TabBar
            selectedTabId={queryParams.tab}
            onSelectedTabChanged={onSelectedTabChanged}
            renderAdditionalContent={renderTabBarCommands}
            disableSticky={false}
          >
            {tabs.map((tab) => (
              <Tab key={tab.id} id={tab.id} name={tab.name} />
            ))}
          </TabBar>
          <div key={tabContainerKey} className="page-content page-content-top">
            {currentTab?.render()}
          </div>
        </Page>
      </Surface>
      <PreviewChangesDialog options={previewDialogOptions} />
      {isManageViewsOpen && (
        <ManageViewsDialog onDismiss={() => setIsManageViewsOpen(false)} />
      )}
      {isHistoryOpen && (
        <HistoryDialog onDismiss={() => setIsHistoryOpen(false)} />
      )}
      {pendingTab !== undefined && (
        <Dialog
          titleProps={{ text: 'Discard changes?' }}
          onDismiss={() => setPendingTab(undefined)}
          footerButtonProps={[
            { text: 'Cancel', onClick: () => setPendingTab(undefined) },
            {
              text: 'Discard and switch',
              danger: true,
              onClick: () => {
                const tab = pendingTab;
                setPendingTab(undefined);
                discardChanges();
                setQueryParams({ tab });
              },
            },
          ]}
        >
          You have unsaved changes. Switching tabs will discard them.
        </Dialog>
      )}
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
  onTabContextChange: (model: LibraryTabModel | undefined) => void,
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
            onTabContextChange={onTabContextChange}
          />
        ),
      };
    }

    return result;
  }, [filter, onTabContextChange, views]);

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

const useHeader = (
  filter: IFilter,
  setTabContainerKey: (updater: (prevId: number) => number) => void,
  previewDialogOptions: ObservableValue<
    PreviewChangesDialogOptions | undefined
  >,
  onManageViews: () => void,
  onHistory: () => void,
) => {
  const queryClient = useQueryClient();

  const [activeModel, setActiveModel] = useState<LibraryTabModel>();
  const [hasChanges, setHasChanges] = useState(false);

  // Stable and idempotent: tabs hand over a freshly built LibraryTabModel on
  // every rebuild, and React runs the outgoing tab's cleanup (register
  // `undefined`) before the incoming tab's effect, so the header always ends
  // up bound to the model that is actually on screen.
  const registerTabModel = useCallback((model?: LibraryTabModel) => {
    setActiveModel(model);
    setHasChanges(!!model?.observable.modified);
  }, []);

  // Keep hasChanges in sync with the registered model.
  useEffect(() => {
    if (!activeModel) {
      return;
    }

    const onChange = () => setHasChanges(activeModel.observable.modified);

    activeModel.observable.subscribe(onChange);
    // Catch edits landed between registration and this effect running.
    onChange();

    return () => activeModel.observable.unsubscribe(onChange);
  }, [activeModel]);

  const discardChanges = useCallback(() => {
    previewDialogOptions.value = undefined;
    queryClient.invalidateQueries({ queryKey: ['variable-groups'] });
    queryClient.invalidateQueries({ queryKey: ['secure-files'] });
    // Remounting the tab container rebuilds every model from the fetched data;
    // the fresh registration resets hasChanges on its own.
    setTabContainerKey((prevId) => prevId + 1);
  }, [previewDialogOptions, queryClient, setTabContainerKey]);

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
          onHistory();
        },
        important: false,
      },
      {
        id: 'manage-views',
        text: 'Manage views',
        onActivate: () => {
          onManageViews();
        },
        important: false,
      },
    ],
    [onManageViews, onHistory],
  );

  const hasChangesCommands: IHeaderCommandBarItem[] = useMemo(
    () => [
      {
        id: 'preview-changes',
        important: true,
        renderButton: ({ id }) => (
          <Button
            key={id}
            primary={true}
            text="Preview changes"
            onClick={() => {
              if (!activeModel) {
                return;
              }

              // Paints Error states; the preview still opens so the user sees
              // them in context.
              activeModel.validate();
              const changes = activeModel.getChanges();
              previewDialogOptions.value = {
                changes,
                onSave: () => saveLibraryChanges(changes),
                onSaved: (outcome) => {
                  void recordSaveHistory(outcome, queryClient);
                  if (outcome.ok) {
                    // Full success: reload immediately, closing the dialog.
                    discardChanges();
                  }
                  // Partial or total failure: leave the dialog open so the
                  // SaveFooter can show per-group errors. For a partial
                  // save, SaveFooter defers the reload to onClosed (below)
                  // so the user gets a chance to read them first; a total
                  // failure needs no reload since nothing changed.
                },
                onClosed: discardChanges,
              };
            }}
          />
        ),
      },
      {
        id: 'discard-changes',
        text: 'Discard changes',
        onActivate: discardChanges,
        important: false,
      },
    ],
    [activeModel, discardChanges, previewDialogOptions, queryClient],
  );

  const renderTabBarCommands = useCallback(
    () => (
      <InlineKeywordFilterBarItem
        filter={filter}
        filterItemKey="keyword"
        isTextItem={false}
      />
    ),
    [filter],
  );

  return {
    headerCommands: hasChanges ? hasChangesCommands : noChangesCommands,
    renderTabBarCommands,
    registerTabModel,
    hasChanges,
    discardChanges,
  };
};
