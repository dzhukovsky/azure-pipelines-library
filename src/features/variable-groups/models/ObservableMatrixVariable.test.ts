import { describe, expect, test } from 'bun:test';
import { States } from '@/shared/components/StateIcon';
import { ObservableMatrixVariable } from './ObservableMatrixVariable';

const GROUPS = [10, 20];

describe('ObservableMatrixVariable', () => {
  test('new variable row is New everywhere', () => {
    const row = new ObservableMatrixVariable('', {}, GROUPS, true);
    expect(row.name.isNew).toBe(true);
    expect(row.name.state.value).toEqual(States.New);
    expect(row.values[10].state.value).toEqual(States.Unchanged); // NULL cell
  });

  test('add/delete cycle on a NULL cell is fully reversible', () => {
    const row = new ObservableMatrixVariable(
      'a',
      { 10: { groupId: 10, value: '1', isSecret: false } },
      GROUPS,
    );
    const cell = row.values[20];

    row.addValue(20);
    expect(cell.state.value).toEqual(States.New);
    expect(row.modified).toBe(true);

    cell.value.value = 'x';
    row.deleteVariable(20);
    expect(cell.state.value).toEqual(States.Unchanged);
    expect(cell.value.value).toBe('');
    expect(row.modified).toBe(false);
  });

  test('deleting an existing cell is a tracked change', () => {
    const row = new ObservableMatrixVariable(
      'a',
      { 10: { groupId: 10, value: '1', isSecret: false } },
      GROUPS,
    );

    row.deleteVariable(10);
    expect(row.values[10].state.value).toEqual(States.Deleted);
    expect(row.modified).toBe(true);

    row.restoreVariable(10);
    expect(row.values[10].state.value).toEqual(States.Unchanged);
    expect(row.modified).toBe(false);
  });
});
