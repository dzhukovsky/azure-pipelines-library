import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { State } from '@/components/shared/State';
import type { ObservableObjectArray } from '@/models/Observable/ObservableObjectArray';
import type { ObservableSecureFile } from '@/models/SecureFile';
import { getArrayChanges } from '@/models/StateObject';
import type { ObservableVariableGroup } from '@/models/VariableGroup';

export type LibraryItem = {
  group?: VariableGroup;
  groupVariable?: Variable;
  file?: SecureFile;
  fileProperty?: SecureFileProperty;
};

export type Variable = {
  name: string;
  value?: string;
  isSecret: boolean;
  state: State;
};

export type VariableGroup = {
  name: string;
  variables: Variable[];
  state: State;
};

export type SecureFileProperty = {
  name: string;
  value: string;
  state: State;
};

export type SecureFile = {
  name: string;
  properties: SecureFileProperty[];
  state: State;
};

export const mapVariableGroupChanges = (
  variableGroups: ObservableObjectArray<ObservableVariableGroup>,
): VariableGroup[] => {
  return getArrayChanges(variableGroups)
    .map<VariableGroup>((vg) => ({
      name: vg.name.value,
      state: vg.state.value,
      variables: getArrayChanges(vg.variables)
        .map<Variable>((v) => ({
          name: v.name.value,
          value: v.value.value,
          isSecret: v.isSecret.value,
          state: v.state.value,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const mapSecureFileChanges = (
  secureFiles: ObservableObjectArray<ObservableSecureFile>,
): SecureFile[] => {
  return getArrayChanges(secureFiles)
    .map<SecureFile>((sf) => ({
      name: sf.name.value,
      state: sf.state.value,
      properties: getArrayChanges(sf.properties)
        .map<SecureFileProperty>((p) => ({
          name: p.name.value,
          value: p.value.value,
          state: p.state.value,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const mapTreeItems = (
  variableGroups: VariableGroup[],
  secureFiles: SecureFile[],
) => {
  const rootItems = [
    ...variableGroups.map<ITreeItem<LibraryItem>>((group) => ({
      data: {
        group: group,
      },
      childItems: group.variables.map<ITreeItem<LibraryItem>>((variable) => ({
        data: {
          groupVariable: variable,
        },
      })),
      expanded: true,
    })),
    ...secureFiles.map<ITreeItem<LibraryItem>>((file) => ({
      data: {
        file: file,
      },
      childItems: file.properties.map<ITreeItem<LibraryItem>>((property) => ({
        data: {
          fileProperty: property,
        },
      })),
    })),
  ];

  return rootItems;
};
