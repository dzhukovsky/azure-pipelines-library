import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { ObservableArray } from 'azure-devops-ui/Core/Observable';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useEffect, useState } from 'react';
import {
  clearMatrixProviderErrors,
  mapMatrixChanges,
  validateMatrixProvider,
} from '@/features/library-changes';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import type { LibraryTabModel } from '../LibraryTabModel';
import { findTreeItem, mapTreeItems } from './mapTreeItems';
import { MatrixDataProvider } from './MatrixDataProvider';
import {
  MatrixTree,
  type MatrixTreeItem,
  type VariableGroupName,
} from './MatrixTree';

export type MatrixTabProps = {
  filter: IFilter;
  groupIds?: number[];
  groupingPatterns?: string[];
  showComparison?: boolean;
  onTabContextChange: (model: LibraryTabModel | undefined) => void;
};

type TabState = {
  data?: VariableGroup[];
  groupIds?: number[];
  groupingPatterns?: readonly string[];
  provider: MatrixDataProvider;
  groupNames: VariableGroupName[];
  items: ObservableArray<ITreeItem<MatrixTreeItem>>;
  collapsedFolders: Set<string>;
};

// Built synchronously from the query cache — provider, group names and tree
// items swap atomically and are fully populated in the same render, so a
// freshly mounted or freshly loaded tab never renders an empty tree frame.
const createTabState = (
  data: VariableGroup[] | undefined,
  groupIds?: number[],
  groupingPatterns?: readonly string[],
): TabState => {
  const visibleGroups = !data
    ? []
    : groupIds
      ? groupIds.flatMap((id) => {
          const group = data.find((x) => x.id === id);
          return group ? [group] : [];
        })
      : data;

  const provider = new MatrixDataProvider(visibleGroups);
  const collapsedFolders = new Set<string>();
  const items = new ObservableArray<ITreeItem<MatrixTreeItem>>(
    mapTreeItems(provider.variables.value, groupingPatterns, collapsedFolders),
  );

  // Rebuild only when rows are added/removed; the synthetic `modified`
  // notify (fired on value edits) must not recreate tree items (focus loss).
  provider.variables.subscribe((e) => {
    if (e?.addedItems?.length || e?.removedItems?.length) {
      items.splice(
        0,
        items.length,
        ...mapTreeItems(provider.variables.value, groupingPatterns, collapsedFolders),
      );
    }
  });

  return {
    data,
    groupIds,
    groupingPatterns,
    provider,
    items,
    collapsedFolders,
    groupNames: visibleGroups.map<VariableGroupName>((x) => ({
      id: x.id,
      name: x.name,
    })),
  };
};

export const MatrixTab = ({
  filter,
  groupIds,
  groupingPatterns,
  showComparison,
  onTabContextChange,
}: MatrixTabProps) => {
  const groups = useVariableGroups();

  const isLoading = groups.isLoading;
  const error = groups.error;

  const [state, setState] = useState(() =>
    createTabState(groups.data, groupIds, groupingPatterns),
  );

  useEffect(() => {
    if (
      !isLoading &&
      // Never throw away pending edits: a rebuild would silently drop them.
      !state.provider.modified &&
      (state.data !== groups.data ||
        state.groupingPatterns?.join('\n') !== groupingPatterns?.join('\n') ||
        state.groupIds?.join() !== groupIds?.join())
    ) {
      setState(createTabState(groups.data, groupIds, groupingPatterns));
    }
  }, [isLoading, groups.data, groupIds, groupingPatterns, state]);

  // Hand the current provider to the page header, and take it back on unmount
  // so the header never acts on a model that is no longer rendered.
  useEffect(() => {
    onTabContextChange({
      observable: state.provider,
      validate: () => validateMatrixProvider(state.provider),
      getChanges: () => mapMatrixChanges(state.provider),
    });

    return () => onTabContextChange(undefined);
  }, [state.provider, onTabContextChange]);

  // Validation errors are only set from the Preview button; nothing else
  // clears them. Once the user reverts the edit that caused an error
  // (provider back to unmodified), drop the stale errors so Error icons
  // don't linger.
  useEffect(() => {
    const onChange = () => {
      if (!state.provider.modified) {
        clearMatrixProviderErrors(state.provider);
      }
    };
    state.provider.subscribe(onChange);
    return () => state.provider.unsubscribe(onChange);
  }, [state.provider]);

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <MatrixTree
      groupNames={state.groupNames}
      items={state.items}
      filter={filter}
      loading={isLoading}
      showComparison={showComparison}
      addNewVariable={() => {
        state.provider.addNewVariable();
      }}
      onToggleItem={(data, expanded) => {
        if (data.type !== 'folder') {
          return;
        }

        if (expanded) {
          state.collapsedFolders.delete(data.data.folderPath);
        } else {
          state.collapsedFolders.add(data.data.folderPath);
        }

        // The filtered provider's items are copies of `state.items`'s entries,
        // so a user toggle never reaches the source array on its own. Patch the
        // matching item (folders can be nested) in place — it's only read on
        // the next rebuild.
        const item = findTreeItem(state.items.value, data);
        if (item) {
          item.expanded = expanded;
        }
      }}
    />
  );
};
