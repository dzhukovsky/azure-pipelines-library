import {
  type ObservableObjectValue,
  StateObject,
} from '@/shared/lib/observable';

export class ObservableSecureFileProperty extends StateObject<ObservableSecureFileProperty> {
  readonly name: ObservableObjectValue<string>;
  readonly value: ObservableObjectValue<string>;

  constructor(name: string, value: string, isNew: boolean) {
    super(isNew);
    this.name = this.addValueProperty(name);
    this.value = this.addValueProperty(value);
  }
}
