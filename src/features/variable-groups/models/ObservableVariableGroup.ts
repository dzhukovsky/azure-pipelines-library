import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import {
  type ObservableObjectArray,
  type ObservableObjectValue,
  StateObject,
} from '@/shared/lib/observable';
import { ObservableVariable } from './ObservableVariable';

export class ObservableVariableGroup extends StateObject<ObservableVariableGroup> {
  readonly id: number;
  readonly modifiedBy?: IdentityRef;
  readonly modifiedOn?: Date;

  readonly name: ObservableObjectValue<string>;
  readonly variables: ObservableObjectArray<ObservableVariable>;

  /**
   * View state, not part of the group: the name is a label until the row's
   * menu asks to rename it, and an editable field from then on.
   */
  readonly renaming = new ObservableValue(false);

  constructor(
    id: number,
    name: string,
    variables: ObservableVariable[],
    isNew: boolean,
    modifiedBy?: IdentityRef,
    modifiedOn?: Date,
  ) {
    super(isNew);
    this.id = id;
    this.modifiedBy = modifiedBy;
    this.modifiedOn = modifiedOn;

    this.name = this.addValueProperty(name);
    this.variables = this.addArrayProperty(variables);
  }

  addVariable(): ObservableVariable {
    const variable = new ObservableVariable('', '', false, true);
    // At the start of the group, right under the group row — visible without
    // scrolling past the group's existing variables.
    this.variables.splice(0, 0, variable);
    return variable;
  }

  removeNewVariable(variable: ObservableVariable) {
    if (!variable.isNew) {
      return;
    }
    this.variables.removeAll((x) => x === variable);
  }
}
