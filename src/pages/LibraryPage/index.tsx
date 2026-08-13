import './index.scss';

import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import { Dialog } from 'azure-devops-ui/Dialog';
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Page } from 'azure-devops-ui/Page';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { Tab, TabBar } from 'azure-devops-ui/Tabs';
import { useCallback, useMemo, useState } from 'react';
import { HistoryDialog } from '@/features/history/components/HistoryDialog';
import { ManageViewsDialog } from '@/features/matrix-views/components/ManageViewsDialog';
import {
  PreviewChangesDialog,
  type PreviewChangesDialogOptions,
} from '@/features/preview-changes/components/PreviewChangesDialog';
import { useNavigation } from '@/shared/hooks/useNavigation';
import { useFilter } from './useFilter';
import { useHeader } from './useHeader';
import { useTabs } from './useTabs';

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
  const [showComparison, setShowComparison] = useState(false);

  const isMatrixTab = (queryParams.tab || 'home').toLowerCase() !== 'home';

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
    isMatrixTab ? { showComparison, setShowComparison } : undefined,
  );
  const { currentTab, tabs } = useTabs(
    queryParams.tab,
    setQueryParams,
    filter,
    registerTabModel,
    showComparison,
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
