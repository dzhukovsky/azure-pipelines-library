import { type State, States, statesEqual } from '@/components/shared/State';
import { ObservableObject } from './Observable/ObservableObject';
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
