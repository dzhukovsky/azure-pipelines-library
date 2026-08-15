import { describe, expect, test } from 'bun:test';
import {
  type IVariableValue,
  ObservableMatrixVariable,
} from '@/features/variable-groups/models';
import { hasEqualValues } from './hasEqualValues';

const GROUPS = [10, 20, 30];

const cell = (
  groupId: number,
  value: string,
  isSecret = false,
): IVariableValue => ({ groupId, value, isSecret });

const variable = (values: IVariableValue[], groupIds = GROUPS) =>
  new ObservableMatrixVariable(
    'a',
    Object.fromEntries(values.map((v) => [v.groupId, v])),
    groupIds,
  );

describe('hasEqualValues', () => {
  test('is true when every group holds the same value', () => {
    const v = variable([cell(10, 'x'), cell(20, 'x'), cell(30, 'x')]);

    expect(hasEqualValues(v, GROUPS)).toBe(true);
  });

  test('is false when one group differs', () => {
    const v = variable([cell(10, 'x'), cell(20, 'y'), cell(30, 'x')]);

    expect(hasEqualValues(v, GROUPS)).toBe(false);
  });

  test('is false when the variable is missing from a group', () => {
    const v = variable([cell(10, 'x'), cell(20, 'x')]);

    expect(hasEqualValues(v, GROUPS)).toBe(false);
  });

  test('is true when every group holds a secret', () => {
    // Azure DevOps returns no value for a secret, so all cells read empty —
    // treated as equal on purpose, otherwise every secret row would survive
    // the filter and make it useless.
    const v = variable([
      cell(10, '', true),
      cell(20, '', true),
      cell(30, '', true),
    ]);

    expect(hasEqualValues(v, GROUPS)).toBe(true);
  });

  test('is false when a variable is secret in some groups only', () => {
    const v = variable([
      cell(10, '', true),
      cell(20, '', true),
      cell(30, 'plain'),
    ]);

    expect(hasEqualValues(v, GROUPS)).toBe(false);
  });

  test('is false when a secret is missing from one group', () => {
    const v = variable([cell(10, '', true), cell(20, '', true)]);

    expect(hasEqualValues(v, GROUPS)).toBe(false);
  });

  test('follows edits: retyping the same value elsewhere makes a row equal', () => {
    const v = variable([cell(10, 'x'), cell(20, 'y'), cell(30, 'x')]);
    v.values[20].value.value = 'x';

    expect(hasEqualValues(v, GROUPS)).toBe(true);
  });

  test('a single-group view has nothing to compare', () => {
    const v = variable([cell(10, 'x')], [10]);

    expect(hasEqualValues(v, [10])).toBe(false);
  });

  test('ignores groups outside the view', () => {
    const v = variable([cell(10, 'x'), cell(20, 'x'), cell(30, 'other')]);

    expect(hasEqualValues(v, [10, 20])).toBe(true);
  });
});
