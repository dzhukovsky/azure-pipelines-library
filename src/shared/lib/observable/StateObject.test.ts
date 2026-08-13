import { describe, expect, test } from 'bun:test';
import { States } from '@/shared/components/StateIcon';
import type { ObservableObjectValue } from './ObservableObjectValue';
import { StateObject } from './StateObject';

class TestItem extends StateObject<TestItem> {
  readonly name: ObservableObjectValue<string>;
  constructor(name: string, isNew: boolean, initiallyPresent?: boolean) {
    super(isNew, initiallyPresent);
    this.name = this.addValueProperty(name);
  }
}

describe('StateObject', () => {
  test('existing item starts Unchanged and derives Modified from edits', () => {
    const item = new TestItem('a', false);
    expect(item.state.value).toEqual(States.Unchanged);

    item.name.value = 'b';
    expect(item.state.value).toEqual(States.Modified);
    expect(item.modified).toBe(true);

    item.name.value = 'a';
    expect(item.state.value).toEqual(States.Unchanged);
    expect(item.modified).toBe(false);
  });

  test('new item is New while present', () => {
    const item = new TestItem('a', true);
    expect(item.state.value).toEqual(States.New);
    item.name.value = 'b'; // editing a new item keeps it New
    expect(item.state.value).toEqual(States.New);
  });

  test('deleting an existing item flips modified and derives Deleted', () => {
    const item = new TestItem('a', false);
    item.delete();
    expect(item.state.value).toEqual(States.Deleted);
    expect(item.modified).toBe(true); // <- deletion is now a tracked change

    item.restore();
    expect(item.state.value).toEqual(States.Unchanged);
    expect(item.modified).toBe(false);
  });

  test('restore of an edited item derives Modified', () => {
    const item = new TestItem('a', false);
    item.name.value = 'b';
    item.delete();
    item.restore();
    expect(item.state.value).toEqual(States.Modified);
  });

  test('non-present new slot (matrix NULL cell) round-trips to Unchanged', () => {
    const item = new TestItem('', true, false);
    expect(item.state.value).toEqual(States.Unchanged);
    expect(item.modified).toBe(false);

    item.restore(); // "Add" pressed
    expect(item.state.value).toEqual(States.New);
    expect(item.modified).toBe(true);

    item.name.value = 'x';
    item.name.reset();
    item.delete(); // delete the not-yet-saved cell
    expect(item.state.value).toEqual(States.Unchanged);
    expect(item.modified).toBe(false); // <- no phantom New
  });

  test('error overrides any state and clears back', () => {
    const item = new TestItem('a', false);
    item.error.value = 'Name is required';
    expect(item.state.value).toEqual(States.error('Name is required'));
    item.error.value = undefined;
    expect(item.state.value).toEqual(States.Unchanged);
  });
});
