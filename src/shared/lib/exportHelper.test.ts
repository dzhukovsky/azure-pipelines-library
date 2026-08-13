import { describe, expect, test } from 'bun:test';
import { expandObject } from './exportHelper';

describe('expandObject', () => {
  test('expands dot-separated keys into nested objects and types values', () => {
    const result = expandObject({
      'app.db.host': 'localhost',
      'app.db.port': '5432',
      'app.debug': 'true',
    }) as Record<string, Record<string, Record<string, unknown>>>;

    expect(result.app.db.host).toBe('localhost');
    expect(result.app.db.port).toBe(5432);
    expect(result.app.debug).toBe(true);
  });

  test('a key of __proto__ does not pollute Object.prototype', () => {
    // A variable literally named `__proto__.polluted` must not walk into the
    // global prototype during the nested-object expansion.
    expandObject({ '__proto__.polluted': 'true' });

    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
