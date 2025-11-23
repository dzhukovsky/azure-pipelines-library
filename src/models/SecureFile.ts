import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import type { ObservableObjectArray } from './Observable/ObservableObjectArray';
import type { ObservableObjectValue } from './Observable/ObservableObjectValue';
import { StateObject } from './StateObject';

export class ObservableSecureFile extends StateObject<ObservableSecureFile> {
  readonly id: string;
  readonly modifiedBy?: IdentityRef;
  readonly modifiedOn?: Date;

  readonly name: ObservableObjectValue<string>;
  readonly properties: ObservableObjectArray<ObservableSecureFileProperty>;

  constructor(
    id: string,
    name: string,
    properties: ObservableSecureFileProperty[],
    isNew: boolean,
    modifiedBy?: IdentityRef,
    modifiedOn?: Date,
  ) {
    super(isNew);
    this.id = id;
    this.modifiedBy = modifiedBy;
    this.modifiedOn = modifiedOn;

    this.name = this.addValueProperty(name);
    this.properties = this.addArrayProperty(properties);
  }
}

export class ObservableSecureFileProperty extends StateObject<ObservableSecureFileProperty> {
  readonly name: ObservableObjectValue<string>;
  readonly value: ObservableObjectValue<string>;

  constructor(name: string, value: string, isNew: boolean) {
    super(isNew);
    this.name = this.addValueProperty(name);
    this.value = this.addValueProperty(value);
  }
}
