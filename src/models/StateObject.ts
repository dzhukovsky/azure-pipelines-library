import { type State, States, statesEqual } from '@/components/shared/State';
import { ObservableObject } from './Observable/ObservableObject';
import type { ObservableObjectArray } from './Observable/ObservableObjectArray';
import { ObservableObjectValue } from './Observable/ObservableObjectValue';

export abstract class StateObject<T> extends ObservableObject<T> {
  readonly state: ObservableObjectValue<State>;

  constructor(isNew: boolean) {
    super();
    const initialState = isNew ? States.New : States.Unchanged;
    this.state = new ObservableObjectValue(initialState, statesEqual);

    this.subscribe(() => {
      this.state.value =
        this.modified && !isNew ? States.Modified : initialState;
    });
  }
}

export function getArrayChanges<T extends StateObject<T>>(
  items: ObservableObjectArray<T>,
) {
  return [
    ...items.initialItems.filter((item) => item.state.value === States.Deleted),
    ...items.value.filter((item) => item.state.value !== States.Unchanged),
  ];
}
