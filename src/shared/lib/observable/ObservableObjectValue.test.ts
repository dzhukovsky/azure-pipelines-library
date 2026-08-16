import { describe, expect, test } from 'bun:test';
import { ObservableObjectValue } from './ObservableObjectValue';

describe('ObservableObjectValue', () => {
  test('tracks modified against initial value', () => {
    const v = new ObservableObjectValue('a');
    expect(v.modified).toBe(false);

    v.value = 'b';
    expect(v.modified).toBe(true);

    v.value = 'a';
    expect(v.modified).toBe(false);
  });

  test('reset returns to initial value and notifies', () => {
    const v = new ObservableObjectValue('a');
    v.value = 'b';

    let notified = 0;
    v.subscribe(() => notified++);
    v.reset();

    expect(v.value).toBe('a');
    expect(v.modified).toBe(false);
    expect(notified).toBe(1);
  });
});
