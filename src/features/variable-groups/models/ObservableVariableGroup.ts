import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import {
  type ObservableObjectArray,
  type ObservableObjectValue,
  StateObject,
} from '@/shared/lib/observable';
import type { ObservableVariable } from './ObservableVariable';

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
