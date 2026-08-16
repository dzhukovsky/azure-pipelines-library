import { Observable } from 'azure-devops-ui/Core/Observable';
import { ObservableObjectArray } from './ObservableObjectArray';
import {
  defaultEqualityComparer,
  type EquilityComparer,
  ObservableObjectValue,
} from './ObservableObjectValue';

export abstract class ObservableObject<TSelf> extends Observable<
  ObservableObject<TSelf>
> {
  private _modified = false;

  private readonly _valueProps: (
    | ObservableObject<unknown>
    | ObservableObjectValue<unknown>
  )[] = [];
  private readonly _arrayProps: ObservableObjectArray<
    ObservableObject<unknown>
  >[] = [];

  get modified(): boolean {
    return this._modified;
  }

  private set modified(value: boolean) {
    if (this._modified !== value) {
      this._modified = value;
      this.notify(this, 'modified');
    }
  }

  protected addProperty<TValue extends ObservableObject<TValue>>(
    value: TValue,
  ) {
    this._valueProps.push(value);
    value.subscribe(() => this.recalculateModified());

    return value;
  }

  protected addValueProperty<TValue>(
    initialValue: TValue,
    comparer: EquilityComparer<TValue> = defaultEqualityComparer,
  ): ObservableObjectValue<TValue> {
    const property = new ObservableObjectValue<TValue>(initialValue, comparer);

    // Erase the value type: _valueProps is only ever read for `.modified`.
    this._valueProps.push(property as ObservableObjectValue<unknown>);
    property.subscribe(() => this.recalculateModified());

    return property;
  }

  protected addArrayProperty<TItem extends ObservableObject<TItem>>(
    initialValue: TItem[] = [],
  ): ObservableObjectArray<TItem> {
    const property = new ObservableObjectArray<TItem>(initialValue);

    // Erase the item type: _arrayProps is only ever read for `.modified`.
    this._arrayProps.push(
      property as unknown as ObservableObjectArray<ObservableObject<unknown>>,
    );
    property.subscribe(() => this.recalculateModified());

    return property;
  }

  private recalculateModified(): void {
    this.modified = this.computeModified();
  }

  /** Whether any tracked property is dirty; overridable to refine the rule. */
  protected computeModified(): boolean {
    return (
      this._valueProps.some((x) => x.modified) ||
      this._arrayProps.some((x) => x.modified)
    );
  }
}
