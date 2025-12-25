import { type IObservable, Observable } from 'azure-devops-ui/Core/Observable';
import { useEffect } from 'react';
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

  private readonly _valueProps: ObservableObjectValue<unknown>[] = [];
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

  protected addValueProperty<TValue>(
    initialValue: TValue,
    comparer: EquilityComparer<TValue> = defaultEqualityComparer,
  ): ObservableObjectValue<TValue> {
    const property = new ObservableObjectValue<TValue>(initialValue, comparer);

    this._valueProps.push(property);
    property.subscribe(() => this.recalculateModified());

    return property;
  }

  protected addArrayProperty<TItem extends ObservableObject<TItem>>(
    initialValue: TItem[] = [],
  ): ObservableObjectArray<TItem> {
    const property = new ObservableObjectArray<TItem>(initialValue);

    this._arrayProps.push(property);
    property.subscribe(() => this.recalculateModified());

    return property;
  }

  private recalculateModified(): void {
    this.modified =
      this._valueProps.some((x) => x.modified) ||
      this._arrayProps.some((x) => x.modified);
  }
}

export type ChangeHandler<T> = (value: T) => void;

export function useSubscribtion<T>(
  observable: IObservable<T>,
  onChange: ChangeHandler<T>,
) {
  useEffect(() => {
    observable.subscribe(onChange);
    return () => observable.unsubscribe(onChange);
  }, [observable, onChange]);
}
