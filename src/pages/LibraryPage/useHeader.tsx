import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'azure-devops-ui/Button';
import type { ObservableValue } from 'azure-devops-ui/Core/Observable';
import type { IHeaderCommandBarItem } from 'azure-devops-ui/HeaderCommandBar';
import { InlineKeywordFilterBarItem } from 'azure-devops-ui/TextFilterBarItem';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { recordSaveHistory } from '@/features/history/recordSaveHistory';
import type { LibraryTabModel } from '@/features/library-editing';
import { NewLibraryItemButton } from '@/features/library-editing/NewLibraryItemButton';
import type { PreviewChangesDialogOptions } from '@/features/preview-changes/components/PreviewChangesDialog';
import { saveLibraryChanges } from '@/features/save-changes/saveLibraryChanges';
import { secureFilesQueryKey } from '@/features/secure-files/hooks/useSecureFiles';
import { variableGroupsQueryKey } from '@/features/variable-groups/hooks/useVariableGroups';

export const useHeader = (
  filter: IFilter,
  setTabContainerKey: (updater: (prevId: number) => number) => void,
  previewDialogOptions: ObservableValue<
    PreviewChangesDialogOptions | undefined
  >,
  onManageViews: () => void,
  onHistory: () => void,
  // Present only while a matrix tab is on screen — the Home tab has no columns
  // to compare.
  matrixToggles?: {
    showComparison: boolean;
    setShowComparison: (value: boolean) => void;
    hideEqualValues: boolean;
    setHideEqualValues: (value: boolean) => void;
    allFoldersExpanded: boolean;
    setAllFoldersExpanded: (value: boolean) => void;
  },
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
    queryClient.invalidateQueries({ queryKey: variableGroupsQueryKey });
    queryClient.invalidateQueries({ queryKey: secureFilesQueryKey });
    // Remounting the tab container rebuilds every model from the fetched data;
    // the fresh registration resets hasChanges on its own.
    setTabContainerKey((prevId) => prevId + 1);
  }, [previewDialogOptions, queryClient, setTabContainerKey]);

  const noChangesCommands: IHeaderCommandBarItem[] = useMemo(
    () => [
      {
        id: 'new-variable-group',
        important: true,
        renderButton: ({ id }) => <NewLibraryItemButton key={id} />,
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
      // rhythm-horizontal-8 spaces the children apart: a margin utility on the
      // button itself loses to `.bolt-button { margin: 0 }` on specificity.
      <div className="flex-row flex-center rhythm-horizontal-8">
        {matrixToggles && (
          <div className="flex-row">
            <Button
              subtle
              iconProps={{
                iconName: matrixToggles.allFoldersExpanded
                  ? 'ChevronFold10'
                  : 'ChevronUnfold10',
                className: 'font-weight-normal',
              }}
              ariaLabel="Expand all folders"
              ariaPressed={matrixToggles.allFoldersExpanded}
              className="comparison-toggle"
              tooltipProps={{
                text: matrixToggles.allFoldersExpanded
                  ? 'Collapse all folders'
                  : 'Expand all folders',
              }}
              onClick={() => {
                const expanded = !matrixToggles.allFoldersExpanded;
                matrixToggles.setAllFoldersExpanded(expanded);
                activeModel?.setAllExpanded?.(expanded);
              }}
            />
            <Button
              subtle
              iconProps={{
                iconName: 'DiffInline',
                className: 'font-weight-normal',
              }}
              ariaLabel="Differences only"
              ariaPressed={matrixToggles.hideEqualValues}
              className="comparison-toggle"
              tooltipProps={{
                text: matrixToggles.hideEqualValues
                  ? 'Show all rows'
                  : 'Show only rows that differ',
              }}
              onClick={() =>
                matrixToggles.setHideEqualValues(!matrixToggles.hideEqualValues)
              }
            />
            <Button
              subtle
              iconProps={{
                iconName: 'DiffSideBySide',
                className: 'font-weight-normal',
              }}
              ariaLabel="Row comparison"
              ariaPressed={matrixToggles.showComparison}
              className="comparison-toggle"
              tooltipProps={{
                text: matrixToggles.showComparison
                  ? 'Hide row comparison'
                  : 'Show row comparison',
              }}
              onClick={() =>
                matrixToggles.setShowComparison(!matrixToggles.showComparison)
              }
            />
          </div>
        )}
        <InlineKeywordFilterBarItem
          filter={filter}
          filterItemKey="keyword"
          isTextItem={false}
        />
      </div>
    ),
    [filter, matrixToggles, activeModel],
  );

  return {
    headerCommands: hasChanges ? hasChangesCommands : noChangesCommands,
    renderTabBarCommands,
    registerTabModel,
    hasChanges,
    discardChanges,
  };
};
