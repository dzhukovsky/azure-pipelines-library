import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import {
  type FileChange,
  type GroupChange,
  getChangeStatus,
  type LibraryChanges,
  type VariableChange,
} from '@/features/library-editing';

/**
 * A renamed variable reads as "previous → current", the same shape group
 * renames use in this dialog and both groups and variables use in the history.
 * Deriving it from getChangeStatus keeps the rename test in one place.
 */
export const variableDisplayName = (change: VariableChange) =>
  getChangeStatus(change) === 'renamed'
    ? `${change.previousKey} → ${change.key}`
    : change.key;

export type LibraryItem = {
  group?: GroupChange;
  groupVariable?: VariableChange;
  file?: FileChange;
  fileProperty?: FileChange['properties'][number];
};

export const mapTreeItems = (changes: LibraryChanges) => {
  const rootItems: ITreeItem<LibraryItem>[] = [
    ...changes.groups.map<ITreeItem<LibraryItem>>((group) => ({
      data: { group },
      childItems: group.variables.map((groupVariable) => ({
        data: { groupVariable },
      })),
      expanded: true,
    })),
    ...changes.files.map<ITreeItem<LibraryItem>>((file) => ({
      data: { file },
      childItems: file.properties.map((fileProperty) => ({
        data: { fileProperty },
      })),
    })),
  ];
  return rootItems;
};
