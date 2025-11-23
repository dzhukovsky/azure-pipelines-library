import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import type { ObservableObjectArray } from './Observable/ObservableObjectArray';
import type { ObservableObjectValue } from './Observable/ObservableObjectValue';
import { StateObject } from './StateObject';

export class ObservableVariableGroup extends StateObject<ObservableVariableGroup> {
  readonly id: number;
  readonly modifiedBy?: IdentityRef;
  readonly modifiedOn?: Date;

  readonly name: ObservableObjectValue<string>;
  readonly variables: ObservableObjectArray<ObservableVariable>;

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
}

export class ObservableVariable extends StateObject<ObservableVariable> {
  readonly name: ObservableObjectValue<string>;
  readonly value: ObservableObjectValue<string>;
  readonly isSecret: ObservableObjectValue<boolean>;

  constructor(name: string, value: string, isSecret: boolean, isNew: boolean) {
    super(isNew);
    this.name = this.addValueProperty(name);
    this.value = this.addValueProperty(value);
    this.isSecret = this.addValueProperty(isSecret);
  }
}
