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
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { mapVariableGroups } from '@/features/variable-groups/mapVariableGroups';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import { useSubscribtion } from '@/shared/lib/observable';
import { HomeTabModel } from './HomeTabModel';
import { HomeTree, type HomeTreeItem } from './HomeTree';

type TabContext = {
  groupsData?: VariableGroup[];
  filesData?: SecureFile[];
  items: ObservableArray<ITreeItem<HomeTreeItem>>;
  expandedGroups: Set<ObservableVariableGroup>;
  model: HomeTabModel;
};

// Built synchronously from the query cache so that a freshly mounted tab
// renders its rows on the first frame instead of flashing an empty tree.
const createTabContext = (
  groupsData: VariableGroup[] | undefined,
  filesData: SecureFile[] | undefined,
): TabContext => {
  const model = createHomeTabModel(groupsData ?? [], filesData ?? []);
  const expandedGroups = new Set<ObservableVariableGroup>();

  const items = new ObservableArray<ITreeItem<HomeTreeItem>>(
    mapTreeItems(model, expandedGroups),
  );

  const rebuild = () => {
    items.splice(0, items.length, ...mapTreeItems(model, expandedGroups));
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
        expandedGroups.add(group);
      }
      onMembershipChange(e);
    });
  });

  return { groupsData, filesData, items, expandedGroups, model };
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
      onToggleGroup={(group, expanded) => {
        if (expanded) {
          context.expandedGroups.add(group);
        } else {
          context.expandedGroups.delete(group);
        }
      }}
    />
  );
};

const mapTreeItems = (
  model: HomeTabModel,
  expandedGroups: Set<ObservableVariableGroup>,
) => [
  ...model.variableGroups.value.map<ITreeItem<HomeTreeItem>>((group) => ({
    data: { type: 'group', data: group },
    childItems: group.variables.value.map<ITreeItem<HomeTreeItem>>(
      (variable) => ({ data: { type: 'groupVariable', data: variable } }),
    ),
    expanded: expandedGroups.has(group),
  })),
  ...model.secureFiles.value.map<ITreeItem<HomeTreeItem>>((file) => ({
    data: { type: 'file', data: file },
    childItems: file.properties.value.map<ITreeItem<HomeTreeItem>>(
      (property) => ({ data: { type: 'fileProperty', data: property } }),
    ),
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
