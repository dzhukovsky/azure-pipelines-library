import type {
  SecureFile,
  VariableGroup,
} from 'azure-devops-extension-api/TaskAgent';
import { ObservableArray } from 'azure-devops-ui/Core/Observable';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useEffect, useState } from 'react';
import { useSecureFiles } from '@/features/secure-files/hooks/useSecureFiles';
import { mapSecureFiles } from '@/features/secure-files/mapSecureFiles';
import type { ObservableSecureFile } from '@/features/secure-files/models';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { mapVariableGroups } from '@/features/variable-groups/mapVariableGroups';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import { useSubscribtion } from '@/shared/lib/observable';
import { HomeTabModel } from './HomeTabModel';
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
  onTabContextChange: (model: HomeTabModel) => void;
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
      (context.groupsData !== groups.data || context.filesData !== files.data)
    ) {
      setContext(createTabContext(groups.data, files.data));
    }
  }, [
    isLoading,
    groups.data,
    files.data,
    context.groupsData,
    context.filesData,
  ]);

  useSubscribtion(context.model, onTabContextChange);

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
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
