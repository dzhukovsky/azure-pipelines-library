import {
  type ObservableObjectValue,
  StateObject,
} from '@/shared/lib/observable';

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
