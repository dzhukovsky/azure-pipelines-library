import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import {
  ObservableVariable,
  ObservableVariableGroup,
} from '@/features/variable-groups/models';

export const mapVariableGroups = (variableGroups: VariableGroup[]) => {
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
