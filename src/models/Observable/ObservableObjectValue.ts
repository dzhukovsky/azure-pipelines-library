import {
  type IObservableValue,
  Observable,
} from 'azure-devops-ui/Core/Observable';

export type EquilityComparer<T> = (a: T, b: T) => boolean;

export const defaultEqualityComparer = <T>(a: T, b: T) => a === b;

export class ObservableObjectValue<T>
  extends Observable<T>
  implements IObservableValue<T>
{
  readonly initialValue: T;

  private _value: T;
  private _modified: boolean = false;
  private readonly _comparer: EquilityComparer<T>;

  constructor(
    value: T,
    comparer: EquilityComparer<T> = defaultEqualityComparer,
  ) {
    super();
    this._value = value;
    this.initialValue = value;
    this._comparer = comparer;
  }

  get value() {
    return this._value;
  }

  set value(newValue: T) {
    if (!this._comparer(this._value, newValue)) {
      this._value = newValue;
      this._modified = !this._comparer(this.initialValue, this._value);
      this.notify(newValue, 'set');
    }
  }

  get modified() {
    return this._modified;
  }

  reset() {
    this.value = this.initialValue;
  }
}
