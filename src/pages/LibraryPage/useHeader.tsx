import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'azure-devops-ui/Button';
import type { ObservableValue } from 'azure-devops-ui/Core/Observable';
import type { IHeaderCommandBarItem } from 'azure-devops-ui/HeaderCommandBar';
import { SplitButton } from 'azure-devops-ui/SplitButton';
import { InlineKeywordFilterBarItem } from 'azure-devops-ui/TextFilterBarItem';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { recordSaveHistory } from '@/features/history/recordSaveHistory';
import type { PreviewChangesDialogOptions } from '@/features/preview-changes/components/PreviewChangesDialog';
import { saveLibraryChanges } from '@/features/save-changes/saveLibraryChanges';
import { secureFilesQueryKey } from '@/features/secure-files/hooks/useSecureFiles';
import { variableGroupsQueryKey } from '@/features/variable-groups/hooks/useVariableGroups';
import { getProjectUrl } from '@/shared/api/configurations';
import { navigateTo } from '@/shared/hooks/useNavigation';
import type { LibraryTabModel } from './LibraryTabModel';

export const useHeader = (
  filter: IFilter,
  setTabContainerKey: (updater: (prevId: number) => number) => void,
  previewDialogOptions: ObservableValue<
    PreviewChangesDialogOptions | undefined
  >,
  onManageViews: () => void,
  onHistory: () => void,
  comparisonToggle?: {
    showComparison: boolean;
    setShowComparison: (value: boolean) => void;
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
      // rhythm-horizontal-8 spaces the children apart: a margin utility on the
      // button itself loses to `.bolt-button { margin: 0 }` on specificity.
      <div className="flex-row flex-center rhythm-horizontal-8">
        {comparisonToggle && (
          <Button
            subtle
            // The icon font has one weight, so the button's 600 would make the
            // browser fake a bolder glyph.
            iconProps={{
              iconName: 'DiffSideBySide',
              className: 'font-weight-normal',
            }}
            // The name stays put while aria-pressed carries the state — a
            // toggle that renames itself reads as two different controls.
            ariaLabel="Row comparison"
            ariaPressed={comparisonToggle.showComparison}
            className="comparison-toggle"
            tooltipProps={{
              text: comparisonToggle.showComparison
                ? 'Hide row comparison'
                : 'Show row comparison',
            }}
            onClick={() =>
              comparisonToggle.setShowComparison(
                !comparisonToggle.showComparison,
              )
            }
          />
        )}
        <InlineKeywordFilterBarItem
          filter={filter}
          filterItemKey="keyword"
          isTextItem={false}
        />
      </div>
    ),
    [filter, comparisonToggle],
  );

  return {
    headerCommands: hasChanges ? hasChangesCommands : noChangesCommands,
    renderTabBarCommands,
    registerTabModel,
    hasChanges,
    discardChanges,
  };
};
