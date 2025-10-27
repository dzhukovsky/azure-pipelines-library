import type {
  SecureFile,
  VariableGroup,
} from 'azure-devops-extension-api/TaskAgent';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useEffect, useState } from 'react';
import { useSecureFiles } from '@/hooks/query/secureFiles';
import { useVariableGroups } from '@/hooks/query/variableGroups';
import { StatusTypes } from '../TextFieldTableCell';
import { type LibraryItem, VariablesTree } from '../VariablesTree';

export const HomeTab = ({ filter }: { filter: IFilter }) => {
  const [treeItems, setTreeItems] = useState<ITreeItem<LibraryItem>[]>(() => [
    // biome-ignore lint/style/noNonNullAssertion: loading placeholder
    { data: undefined! },
  ]);

  const groups = useVariableGroups();
  const files = useSecureFiles();

  const isLoading = groups.isLoading || files.isLoading;
  const error = groups.error || files.error;

  useEffect(() => {
    if (!isLoading) {
      const items = mapTreeItems(groups.data ?? [], files.data ?? []);
      setTreeItems(items);
    }
  }, [isLoading, groups.data, files.data]);

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return <VariablesTree items={treeItems} filter={filter} />;
};

const mapTreeItems = (
  variableGroups: VariableGroup[],
  secureFiles: SecureFile[],
) => {
  const rootItems = [
    ...variableGroups.map<ITreeItem<LibraryItem>>((group) => ({
      data: {
        id: group.id,
        name: group.name,
        type: 'group',
        modifiedBy: group.modifiedBy ?? group.createdBy,
        modifiedOn: group.modifiedOn ?? group.createdOn,
      },
      childItems: Object.entries(group.variables).map<ITreeItem<LibraryItem>>(
        ([name, variable]) => ({
          data: {
            name: new ObservableValue(name),
            value: new ObservableValue(variable.value),
            isSecret: variable.isSecret,
            status: new ObservableValue(StatusTypes.Untracked),
            type: 'groupVariable',
          },
        }),
      ),
      expanded: false,
    })),
    ...secureFiles.map<ITreeItem<LibraryItem>>((file) => ({
      data: {
        name: file.name,
        type: 'file',
        modifiedBy: file.modifiedBy ?? file.createdBy,
        modifiedOn: file.modifiedOn ?? file.createdOn,
      },
    })),
  ];

  return rootItems;
};
