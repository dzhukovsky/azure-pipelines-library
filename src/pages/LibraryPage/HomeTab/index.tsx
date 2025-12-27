import type {
  SecureFile,
  VariableGroup,
} from 'azure-devops-extension-api/TaskAgent';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useEffect, useState } from 'react';
import { useSecureFiles } from '@/features/secure-files/hooks/useSecureFiles';
import { mapSecureFiles } from '@/features/secure-files/mapSecureFiles';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { mapVariableGroups } from '@/features/variable-groups/mapVariableGroups';
import { useSubscribtion } from '@/shared/lib/observable';
import { HomeTabModel } from './HomeTabModel';
import { type LibraryItem, VariablesTree } from './VariablesTree';

type TabContext = {
  items: ITreeItem<LibraryItem>[];
  model: HomeTabModel;
};

export const HomeTab = ({
  filter,
  onTabContextChange,
}: {
  filter: IFilter;
  onTabContextChange: (model: HomeTabModel) => void;
}) => {
  const [context, setContext] = useState<TabContext>(() => ({
    items: [],
    model: new HomeTabModel([], []),
  }));

  const groups = useVariableGroups();
  const files = useSecureFiles();

  const isLoading = groups.isLoading || files.isLoading;
  const error = groups.error || files.error;

  useEffect(() => {
    if (!isLoading) {
      const model = createHomeTabModel(groups.data ?? [], files.data ?? []);
      const items = mapTreeItems(model);
      setContext({
        items,
        model,
      });
    }
  }, [isLoading, groups.data, files.data]);

  useSubscribtion(context.model, onTabContextChange);

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <VariablesTree items={context.items} filter={filter} loading={isLoading} />
  );
};

const mapTreeItems = (model: HomeTabModel) => {
  const rootItems = [
    ...model.variableGroups.value.map<ITreeItem<LibraryItem>>((group) => ({
      data: {
        group: group,
      },
      childItems: group.variables.value.map<ITreeItem<LibraryItem>>(
        (variable) => ({
          data: {
            groupVariable: variable,
          },
        }),
      ),
      expanded: false,
    })),
    ...model.secureFiles.value.map<ITreeItem<LibraryItem>>((file) => ({
      data: {
        file: file,
      },
      childItems: file.properties.value.map<ITreeItem<LibraryItem>>(
        (property) => ({
          data: {
            fileProperty: property,
          },
        }),
      ),
    })),
  ];

  return rootItems;
};

const createHomeTabModel = (
  variableGroups: VariableGroup[],
  secureFiles: SecureFile[],
) => {
  const groups = mapVariableGroups(variableGroups);
  const files = mapSecureFiles(secureFiles);

  return new HomeTabModel(groups, files);
};
