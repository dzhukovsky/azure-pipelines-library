import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import {
  type ObservableObjectArray,
  type ObservableObjectValue,
  StateObject,
} from '@/shared/lib/observable';
import type { ObservableSecureFileProperty } from './ObservableSecureFileProperty';

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
