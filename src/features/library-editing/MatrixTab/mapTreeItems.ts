import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import {
  type FolderNode,
  groupByPatterns,
} from '@/features/matrix-views/lib/grouping';
import type { ObservableMatrixVariable } from '@/features/variable-groups/models';
import type { MatrixTreeItem } from './MatrixTree';

const variableItem = (
  variable: ObservableMatrixVariable,
): ITreeItem<MatrixTreeItem> => ({
  data: { type: 'variable', data: variable },
  childItems: [],
  expanded: false,
});

const folderItem = (
  folder: FolderNode<ObservableMatrixVariable>,
  expandedFolders: ReadonlySet<string>,
): ITreeItem<MatrixTreeItem> => ({
  data: {
    type: 'folder',
    data: {
      folderName: folder.name,
      folderPath: folder.path,
      variables: folder.items,
    },
  },
  childItems: [
    ...folder.folders.map((sub) => folderItem(sub, expandedFolders)),
    ...folder.items.map(variableItem),
  ],
  // Collapsed by default; only an explicit user expand survives rebuilds.
  expanded: expandedFolders.has(folder.path),
});

export const mapTreeItems = (
  variables: ObservableMatrixVariable[],
  groupingPatterns: readonly string[] | undefined,
  expandedFolders: ReadonlySet<string>,
): ITreeItem<MatrixTreeItem>[] => {
  const { folders, ungrouped } = groupByPatterns(
    variables,
    (variable) => variable.name.name.value ?? '',
    groupingPatterns,
  );

  return [
    ...folders.map((folder) => folderItem(folder, expandedFolders)),
    ...ungrouped.map(variableItem),
  ];
};

/** Every folder path in the tree, parents before their children — the set the
 * expand/collapse all action writes into `expandedFolders`. */
export const collectFolderPaths = (
  items: readonly ITreeItem<MatrixTreeItem>[],
): string[] =>
  items.flatMap((item) =>
    item.data.type === 'folder'
      ? [item.data.data.folderPath, ...collectFolderPaths(item.childItems ?? [])]
      : [],
  );

export const findTreeItem = (
  items: readonly ITreeItem<MatrixTreeItem>[],
  data: MatrixTreeItem,
): ITreeItem<MatrixTreeItem> | undefined => {
  for (const item of items) {
    if (item.data === data) {
      return item;
    }

    const found = findTreeItem(item.childItems ?? [], data);
    if (found) {
      return found;
    }
  }

  return undefined;
};
