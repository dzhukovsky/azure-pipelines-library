import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import {
  type GroupId,
  type IVariableValue,
  ObservableMatrixVariable,
} from '@/features/variable-groups/models';
import {
  ObservableObject,
  type ObservableObjectArray,
} from '@/shared/lib/observable';

export type MatrixGroupRef = { id: number; name: string; modifiedOn?: Date };

export class MatrixDataProvider extends ObservableObject<MatrixDataProvider> {
  readonly groups: MatrixGroupRef[];
  readonly variables: ObservableObjectArray<ObservableMatrixVariable>;

  constructor(variableGroups: VariableGroup[]) {
    super();
    this.groups = variableGroups.map((vg) => ({
      id: vg.id,
      name: vg.name,
      modifiedOn: vg.modifiedOn ?? vg.createdOn,
    }));
    this.variables = this.addArrayProperty(mapVariables(variableGroups));
  }

  get groupIds(): GroupId[] {
    return this.groups.map((g) => g.id);
  }

  addNewVariable(): ObservableMatrixVariable {
    const variable = new ObservableMatrixVariable('', {}, this.groupIds, true);
    // At the end — right next to the Add button below the tree.
    this.variables.push(variable);
    return variable;
  }
}

const mapVariables = (variableGroups: VariableGroup[]) => {
  const groupIds = variableGroups.map((vg) => vg.id);

  const variableNames = [
    ...new Set<string>(
      variableGroups.flatMap((vg) => Object.keys(vg.variables)),
    ),
  ];

  // Prototype-less so a `__proto__` variable name can't pollute Object.prototype.
  const values: Record<string, Record<GroupId, IVariableValue>> =
    Object.create(null);

  variableGroups.forEach((vg) => {
    variableNames.forEach((name) => {
      if (!values[name]) {
        values[name] = {};
      }

      const variable = vg.variables[name];
      if (variable) {
        values[name][vg.id] = {
          groupId: vg.id,
          isSecret: variable.isSecret ?? false,
          value: variable.value ?? '',
        };
      }
    });
  });

  return variableNames.map(
    (name) => new ObservableMatrixVariable(name, values[name], groupIds),
  );
};
