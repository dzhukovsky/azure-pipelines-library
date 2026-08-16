import { type State, States, statesEqual } from '@/shared/components/StateIcon';
import { ObservableObject } from './ObservableObject';
import type { ObservableObjectArray } from './ObservableObjectArray';
import { ObservableObjectValue } from './ObservableObjectValue';

export abstract class StateObject<T> extends ObservableObject<T> {
  readonly isNew: boolean;
  readonly present: ObservableObjectValue<boolean>;
  readonly error: ObservableObjectValue<string | undefined>;

  private readonly _state: ObservableObjectValue<State>;

  get state(): ObservableObjectValue<State> {
    return this._state;
  }

  // Deleting a never-saved item is a no-op, so it must not read as a pending
  // change: this keeps `modified` in agreement with an Unchanged state (a new
  // item that is no longer present computes to Unchanged, see computeState).
  protected override computeModified(): boolean {
    if (this.isNew && !this.present.value) {
      return false;
    }
    return super.computeModified();
  }

  constructor(isNew: boolean, initiallyPresent = true) {
    super();
    this.isNew = isNew;

    this.present = this.addValueProperty(initiallyPresent);
    this.error = new ObservableObjectValue<string | undefined>(undefined);
    this._state = new ObservableObjectValue<State>(
      this.computeState(),
      statesEqual,
    );

    const update = () => {
      this._state.value = this.computeState();
    };

    // `modified` flips notify `this`; `present` and `error` can change state
    // without flipping `modified`, so subscribe to them directly.
    this.subscribe(update);
    this.present.subscribe(update);
    this.error.subscribe(update);
  }

  delete() {
    this.present.value = false;
  }

  restore() {
    this.present.value = true;
  }

  private computeState(): State {
    if (this.error.value) {
      return States.error(this.error.value);
    }
    if (!this.present.value) {
      return this.isNew ? States.Unchanged : States.Deleted;
    }
    if (this.isNew) {
      return States.New;
    }
    return this.modified ? States.Modified : States.Unchanged;
  }
}

export function getArrayChanges<T extends StateObject<T>>(
  items: ObservableObjectArray<T>,
) {
  // Deleted items now stay in the array (present=false), so a single scan
  // over the current items covers additions, edits and deletions.
  return items.value.filter((item) => item.state.value.type !== 'Unchanged');
}
