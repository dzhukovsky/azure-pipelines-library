import { describe, expect, test } from 'bun:test';
import { States } from '@/shared/components/StateIcon';
import { getArrayChanges } from '@/shared/lib/observable';
import { ObservableVariable } from './ObservableVariable';
import { ObservableVariableGroup } from './ObservableVariableGroup';

const makeGroup = () =>
  new ObservableVariableGroup(
    1,
    'group',
    [new ObservableVariable('a', '1', false, false)],
    false,
  );

describe('ObservableVariableGroup', () => {
  test('deleting an existing variable keeps it in the array and marks the group modified', () => {
    const group = makeGroup();
    const variable = group.variables.value[0];

    variable.delete();

    expect(group.variables.value).toContain(variable);
    expect(group.modified).toBe(true);
    expect(getArrayChanges(group.variables)).toEqual([variable]);

    variable.restore();
    expect(group.modified).toBe(false);
    expect(getArrayChanges(group.variables)).toEqual([]);
  });

  test('addVariable adds a New variable; removeNewVariable reverts it completely', () => {
    const group = makeGroup();
    const added = group.addVariable();

    expect(added.isNew).toBe(true);
    expect(added.state.value).toEqual(States.New);
    expect(group.modified).toBe(true);

    group.removeNewVariable(added);
    expect(group.variables.value).not.toContain(added);
    expect(group.modified).toBe(false);
  });

  test('addVariable inserts the new variable at the start of the group', () => {
    const group = makeGroup();
    const added = group.addVariable();

    expect(group.variables.value[0]).toBe(added);
  });
});
