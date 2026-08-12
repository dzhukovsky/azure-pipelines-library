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
import type { ObservableMatrixVariable } from '@/features/variable-groups/models';
import type { LibraryTabModel } from '../LibraryTabModel';
import { MatrixDataProvider } from './MatrixDataProvider';
import {
  MatrixTree,
  type MatrixTreeItem,
  type VariableGroupName,
} from './MatrixTree';

export type MatrixTabProps = {
  filter: IFilter;
  groupIds?: number[];
  onTabContextChange: (model: LibraryTabModel | undefined) => void;
};

type TabState = {
  data?: VariableGroup[];
  provider: MatrixDataProvider;
  groupNames: VariableGroupName[];
  items: ObservableArray<ITreeItem<MatrixTreeItem>>;
};

// Built synchronously from the query cache — provider, group names and tree
// items swap atomically and are fully populated in the same render, so a
// freshly mounted or freshly loaded tab never renders an empty tree frame.
const createTabState = (
  data: VariableGroup[] | undefined,
  groupIds?: number[],
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
  const items = new ObservableArray<ITreeItem<MatrixTreeItem>>(
    mapTreeItems(provider.variables.value),
  );

  // Rebuild only when rows are added/removed; the synthetic `modified`
  // notify (fired on value edits) must not recreate tree items (focus loss).
  provider.variables.subscribe((e) => {
    if (e?.addedItems?.length || e?.removedItems?.length) {
      items.splice(0, items.length, ...mapTreeItems(provider.variables.value));
    }
  });

  return {
    data,
    provider,
    items,
    groupNames: visibleGroups.map<VariableGroupName>((x) => ({
      id: x.id,
      name: x.name,
    })),
  };
};

export const MatrixTab = ({
  filter,
  groupIds,
  onTabContextChange,
}: MatrixTabProps) => {
  const groups = useVariableGroups();

  const isLoading = groups.isLoading;
  const error = groups.error;

  const [state, setState] = useState(() =>
    createTabState(groups.data, groupIds),
  );

  useEffect(() => {
    if (
      !isLoading &&
      // Never throw away pending edits: a rebuild would silently drop them.
      !state.provider.modified &&
      state.data !== groups.data
    ) {
      setState(createTabState(groups.data, groupIds));
    }
  }, [isLoading, groups.data, groupIds, state]);

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
      addNewVariable={() => {
        state.provider.addNewVariable();
      }}
    />
  );
};

const mapTreeItems = (variables: ObservableMatrixVariable[]) => {
  const rootItems = [
    ...variables.map<ITreeItem<MatrixTreeItem>>((variable) => ({
      data: {
        type: 'variable',
        data: variable,
      },
      childItems: [],
      expanded: false,
    })),
  ];

  return rootItems;
};
