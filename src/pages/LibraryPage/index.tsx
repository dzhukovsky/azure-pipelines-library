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
import { useMatrixViews } from '@/features/matrix-views/hooks/useMatrixViews';
import {
  PreviewChangesDialog,
  type PreviewChangesDialogOptions,
} from '@/features/preview-changes/components/PreviewChangesDialog';
import { useSecureFiles } from '@/features/secure-files/hooks/useSecureFiles';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { goToNewVariableGroup } from '@/features/variable-groups/newVariableGroup';
import { logoUrl } from '@/shared/assets/logo';
import { EmptyState } from '@/shared/components/EmptyState';
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

  // A brand-new project with nothing to show gets a single full-page zero-data
  // (no tab bar) instead of an empty Home tab, the way Azure DevOps greets a
  // first-run surface. Tabs return as soon as there is a group, file or view.
  const groups = useVariableGroups();
  const files = useSecureFiles();
  const views = useMatrixViews();
  const nothingYet =
    !groups.isLoading &&
    !files.isLoading &&
    !views.isLoading &&
    !groups.data?.length &&
    !files.data?.length &&
    !views.data?.length;

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

  if (nothingYet) {
    return (
      <Surface background={SurfaceBackground.neutral}>
        <Page className="height-100vh flex-grow">
          <Header title="Advanced Library" titleSize={TitleSize.Large} />
          <div className="page-content page-content-top">
            <EmptyState
              imagePath={logoUrl}
              primaryText="No variable groups or secure files yet"
              secondaryText="Create a variable group to start managing your library."
              action={{
                text: 'New variable group',
                onClick: goToNewVariableGroup,
              }}
            />
          </div>
        </Page>
      </Surface>
    );
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
