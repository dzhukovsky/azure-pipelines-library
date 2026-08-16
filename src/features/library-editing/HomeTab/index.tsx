import type {
  SecureFile,
  VariableGroup,
} from 'azure-devops-extension-api/TaskAgent';
import { ObservableArray } from 'azure-devops-ui/Core/Observable';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useEffect, useState } from 'react';
import {
  clearHomeModelErrors,
  HomeTabModel,
  mapHomeChanges,
  validateHomeModel,
} from '@/features/library-editing';
import { useSecureFiles } from '@/features/secure-files/hooks/useSecureFiles';
import { mapSecureFiles } from '@/features/secure-files/mapSecureFiles';
import type { ObservableSecureFile } from '@/features/secure-files/models';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { mapVariableGroups } from '@/features/variable-groups/mapVariableGroups';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import type { LibraryTabModel } from '../LibraryTabModel';
import { HomeTree, type HomeTreeItem } from './HomeTree';

type ExpandableItem = ObservableVariableGroup | ObservableSecureFile;

type TabContext = {
  groupsData?: VariableGroup[];
  filesData?: SecureFile[];
  items: ObservableArray<ITreeItem<HomeTreeItem>>;
  expandedItems: Set<ExpandableItem>;
  model: HomeTabModel;
};

// Built synchronously from the query cache so that a freshly mounted tab
// renders its rows on the first frame instead of flashing an empty tree.
const createTabContext = (
  groupsData: VariableGroup[] | undefined,
  filesData: SecureFile[] | undefined,
): TabContext => {
  const model = createHomeTabModel(groupsData ?? [], filesData ?? []);
  const expandedItems = new Set<ExpandableItem>();

  const items = new ObservableArray<ITreeItem<HomeTreeItem>>(
    mapTreeItems(model, expandedItems),
  );

  const rebuild = () => {
    items.splice(0, items.length, ...mapTreeItems(model, expandedItems));
  };

  // Rebuild only when rows are added/removed; value edits flow through the
  // per-cell observables and must not recreate tree items (focus loss).
  const onMembershipChange = (e: {
    addedItems?: unknown[];
    removedItems?: unknown[];
  }) => {
    if (e?.addedItems?.length || e?.removedItems?.length) {
      rebuild();
    }
  };

  model.variableGroups.value.forEach((group) => {
    group.variables.subscribe((e) => {
      if (e?.addedItems?.length) {
        // Auto-expand a group when a variable is added to it.
        expandedItems.add(group);
      }
      onMembershipChange(e);
    });
  });

  return { groupsData, filesData, items, expandedItems, model };
};

export const HomeTab = ({
  filter,
  onTabContextChange,
}: {
  filter: IFilter;
  onTabContextChange: (model: LibraryTabModel | undefined) => void;
}) => {
  const groups = useVariableGroups();
  const files = useSecureFiles();

  const isLoading = groups.isLoading || files.isLoading;
  const error = groups.error || files.error;

  const [context, setContext] = useState<TabContext>(() =>
    isLoading
      ? createTabContext(undefined, undefined)
      : createTabContext(groups.data, files.data),
  );

  useEffect(() => {
    if (
      !isLoading &&
      // Never throw away pending edits: a rebuild would silently drop them.
      !context.model.modified &&
      (context.groupsData !== groups.data || context.filesData !== files.data)
    ) {
      setContext(createTabContext(groups.data, files.data));
    }
  }, [isLoading, groups.data, files.data, context]);

  // Hand the current model to the page header, and take it back on unmount so
  // the header never acts on a model that is no longer rendered.
  useEffect(() => {
    onTabContextChange({
      observable: context.model,
      validate: () => validateHomeModel(context.model),
      getChanges: () => mapHomeChanges(context.model),
    });

    return () => onTabContextChange(undefined);
  }, [context.model, onTabContextChange]);

  // Validation errors are only set from the Preview button; nothing else
  // clears them. Once the user reverts the edit that caused an error (model
  // back to unmodified), drop the stale errors so Error icons don't linger.
  useEffect(() => {
    const onChange = () => {
      if (!context.model.modified) {
        clearHomeModelErrors(context.model);
      }
    };
    context.model.subscribe(onChange);
    return () => context.model.unsubscribe(onChange);
  }, [context.model]);

  if (error) {
    return (
      <ErrorMessage
        error={error}
        onRetry={() => {
          groups.refetch();
          files.refetch();
        }}
      />
    );
  }

  return (
    <HomeTree
      items={context.items}
      filter={filter}
      loading={isLoading}
      onToggleItem={(data, expanded) => {
        if (expanded) {
          context.expandedItems.add(data);
        } else {
          context.expandedItems.delete(data);
        }

        // The provider's items are copies of `context.items`'s entries, so a
        // user toggle never reaches the source array on its own. Patch the
        // matching root in place — it's only read on the next rebuild/re-seed,
        // no notify needed.
        const root = context.items.value.find((it) => it.data.data === data);
        if (root) {
          root.expanded = expanded;
        }
      }}
    />
  );
};

const mapTreeItems = (
  model: HomeTabModel,
  expandedItems: Set<ExpandableItem>,
) => [
  ...model.variableGroups.value.map<ITreeItem<HomeTreeItem>>((group) => ({
    data: { type: 'group', data: group },
    childItems: group.variables.value.map<ITreeItem<HomeTreeItem>>(
      (variable) => ({ data: { type: 'groupVariable', data: variable } }),
    ),
    expanded: expandedItems.has(group),
  })),
  ...model.secureFiles.value.map<ITreeItem<HomeTreeItem>>((file) => ({
    data: { type: 'file', data: file },
    childItems: file.properties.value.map<ITreeItem<HomeTreeItem>>(
      (property) => ({ data: { type: 'fileProperty', data: property } }),
    ),
    expanded: expandedItems.has(file),
  })),
];

const createHomeTabModel = (
  variableGroups: VariableGroup[],
  secureFiles: SecureFile[],
) => {
  const groups = mapVariableGroups(variableGroups);
  const files = mapSecureFiles(secureFiles);

  return new HomeTabModel(groups, files);
};
