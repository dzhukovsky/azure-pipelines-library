import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import type {
  FileChange,
  GroupChange,
  LibraryChanges,
  VariableChange,
} from '@/features/library-changes';

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
