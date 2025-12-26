import type {
  SecureFile,
  VariableGroup,
} from 'azure-devops-extension-api/TaskAgent';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useEffect, useState } from 'react';
import {
  ObservableSecureFile,
  ObservableSecureFileProperty,
} from '@/features/secure-files/models';
import {
  ObservableVariable,
  ObservableVariableGroup,
} from '@/features/variable-groups/models';
import { useSecureFiles } from '@/hooks/query/secureFiles';
import { useVariableGroups } from '@/hooks/query/variableGroups';
import { HomeTabModel } from '@/models/tabs/HomeTabModel';
import { useSubscribtion } from '@/shared/lib/observable';
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
  const groups = mapObservableVariableGroups(variableGroups);
  const files = mapObservableSecureFiles(secureFiles);

  return new HomeTabModel(groups, files);
};

const mapObservableVariableGroups = (variableGroups: VariableGroup[]) => {
  return variableGroups.map((vg) => {
    const variables = Object.entries(vg.variables).map(([name, variable]) => {
      return new ObservableVariable(
        name,
        variable.value,
        variable.isSecret ?? false,
        false,
      );
    });
    return new ObservableVariableGroup(
      vg.id,
      vg.name,
      variables,
      false,
      vg.modifiedBy ?? vg.createdBy,
      vg.modifiedOn ?? vg.createdOn,
    );
  });
};

const mapObservableSecureFiles = (secureFiles: SecureFile[]) => {
  return secureFiles.map((file) => {
    const properties = Object.entries(file.properties ?? {}).map(
      ([name, value]) => {
        return new ObservableSecureFileProperty(name, value, false);
      },
    );
    return new ObservableSecureFile(
      file.id,
      file.name,
      properties,
      false,
      file.modifiedBy ?? file.createdBy,
      file.modifiedOn ?? file.createdOn,
    );
  });
};
