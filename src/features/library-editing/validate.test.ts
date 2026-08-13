import { describe, expect, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { HomeTabModel, MatrixDataProvider } from '@/features/library-editing';
import {
  ObservableVariable,
  ObservableVariableGroup,
} from '@/features/variable-groups/models';
import { mapHomeChanges } from './fromHomeModel';
import { mapMatrixChanges } from './fromMatrixProvider';
import {
  clearHomeModelErrors,
  clearMatrixProviderErrors,
  hasErrors,
  validateHomeModel,
  validateMatrixProvider,
} from './validate';

const makeModel = (variables: ObservableVariable[]) =>
  new HomeTabModel([new ObservableVariableGroup(1, 'g', variables, false)], []);

describe('validateHomeModel', () => {
  test('empty name on a present variable is an error', () => {
    const v = new ObservableVariable('', 'x', false, true);
    const model = makeModel([v]);
    expect(validateHomeModel(model)).toBe(false);
    expect(v.state.value.type).toBe('Error');
  });

  test('duplicate names are errors on all duplicates; deleted rows do not count', () => {
    const a = new ObservableVariable('Same', '1', false, false);
    const b = new ObservableVariable('same ', '2', false, true);
    const c = new ObservableVariable('same', '3', false, false);
    c.delete();
    const model = makeModel([a, b, c]);

    expect(validateHomeModel(model)).toBe(false);
    expect(a.state.value.type).toBe('Error');
    expect(b.state.value.type).toBe('Error');
    expect(c.state.value.type).toBe('Deleted'); // not part of duplicates

    b.name.value = 'other';
    expect(validateHomeModel(model)).toBe(true);
    expect(a.state.value.type).toBe('Unchanged'); // errors cleared on revalidate
  });

  test('a variable in a group being deleted does not block the save', () => {
    const doomed = new ObservableVariable('', 'x', false, false); // empty name
    const deletedGroup = new ObservableVariableGroup(1, 'old', [doomed], false);
    deletedGroup.delete();
    const keptGroup = new ObservableVariableGroup(
      2,
      'kept',
      [new ObservableVariable('ok', 'v', false, false)],
      false,
    );
    const model = new HomeTabModel([deletedGroup, keptGroup], []);

    expect(validateHomeModel(model)).toBe(true);
  });

  test('duplicate names surface via hasErrors(mapHomeChanges(...))', () => {
    const a = new ObservableVariable('dup', '1', false, false);
    const b = new ObservableVariable('dup', '2', false, false);
    const model = makeModel([a, b]);
    a.value.value = '1-edited'; // give it a change so it is emitted at all

    expect(validateHomeModel(model)).toBe(false);
    expect(hasErrors(mapHomeChanges(model))).toBe(true);
  });

  test('secret to plain without re-entered value is an error', () => {
    const s = new ObservableVariable(
      'secret',
      undefined as unknown as string,
      true,
      false,
    );
    const model = makeModel([s]);
    s.isSecret.value = false;
    expect(validateHomeModel(model)).toBe(false);

    s.value.value = 'now-visible';
    expect(validateHomeModel(model)).toBe(true);
  });

  test('renaming a secret variable without re-entering the value is an error', () => {
    const s = new ObservableVariable('secret', 'shh', true, false);
    const model = makeModel([s]);

    s.name.value = 'renamed-secret';
    expect(validateHomeModel(model)).toBe(false);
    expect(s.error.value).toBe(
      'Re-enter the value when renaming a secret variable',
    );

    s.value.value = 'now-visible';
    expect(validateHomeModel(model)).toBe(true);
  });

  test('renaming a plain variable validates clean', () => {
    const p = new ObservableVariable('plain', 'value', false, false);
    const model = makeModel([p]);

    p.name.value = 'renamed-plain';
    expect(validateHomeModel(model)).toBe(true);
    expect(p.error.value).toBeUndefined();
  });
});

describe('validateHomeModel — group names', () => {
  const makeGroups = (...names: string[]) =>
    new HomeTabModel(
      names.map(
        (name, index) =>
          new ObservableVariableGroup(index + 1, name, [], false),
      ),
      [],
    );

  test('renaming a group to an empty name is an error', () => {
    const model = makeGroups('group');
    const [group] = model.variableGroups.value;

    group.name.value = '  ';

    expect(validateHomeModel(model)).toBe(false);
    expect(group.state.value.type).toBe('Error');
    expect(hasErrors(mapHomeChanges(model))).toBe(true);
  });

  test('renaming a group onto another one errors both', () => {
    const model = makeGroups('first', 'second');
    const [first, second] = model.variableGroups.value;

    second.name.value = 'FIRST ';

    expect(validateHomeModel(model)).toBe(false);
    expect(first.state.value.type).toBe('Error');
    expect(second.state.value.type).toBe('Error');

    second.name.value = 'third';
    expect(validateHomeModel(model)).toBe(true);
    expect(first.state.value.type).toBe('Unchanged');
  });

  test('a plain rename validates clean and carries the previous name', () => {
    const model = makeGroups('group');
    const [group] = model.variableGroups.value;

    group.name.value = 'renamed';

    expect(validateHomeModel(model)).toBe(true);
    expect(mapHomeChanges(model).groups[0]).toMatchObject({
      name: 'renamed',
      nameChanged: true,
      previousName: 'group',
    });
  });
});

describe('clearHomeModelErrors', () => {
  test('clears errors and resets states after reverting the edit that caused them', () => {
    const a = new ObservableVariable('a', '1', false, false);
    const b = new ObservableVariable('b', '2', false, false);
    const model = makeModel([a, b]);

    b.name.value = 'a'; // duplicate -> error on both
    expect(validateHomeModel(model)).toBe(false);
    expect(a.state.value.type).toBe('Error');
    expect(b.state.value.type).toBe('Error');

    b.name.reset(); // revert the offending edit
    expect(model.modified).toBe(false);

    clearHomeModelErrors(model);
    expect(a.error.value).toBeUndefined();
    expect(b.error.value).toBeUndefined();
    expect(a.state.value.type).toBe('Unchanged');
    expect(b.state.value.type).toBe('Unchanged');
  });
});

const makeProvider = (
  groups: {
    id: number;
    name: string;
    variables: Record<string, { value: string; isSecret: boolean }>;
  }[],
) => new MatrixDataProvider(groups as unknown as VariableGroup[]);

describe('validateMatrixProvider', () => {
  test('empty name on a new row with a changed cell is an error', () => {
    const provider = makeProvider([
      { id: 10, name: 'dev', variables: {} },
      { id: 20, name: 'prod', variables: {} },
    ]);
    provider.addNewVariable();
    const row = provider.variables.value[0];
    row.addValue(10);
    row.values[10].value.value = 'x';

    expect(validateMatrixProvider(provider)).toBe(false);
    expect(row.name.error.value).toBe('Name is required');
  });

  test('duplicate row names (case-insensitive, trimmed) are errors on both; clears on rename', () => {
    const provider = makeProvider([
      {
        id: 10,
        name: 'dev',
        variables: { Same: { value: '1', isSecret: false } },
      },
      {
        id: 20,
        name: 'prod',
        variables: { 'same ': { value: '2', isSecret: false } },
      },
    ]);

    expect(validateMatrixProvider(provider)).toBe(false);
    const [row1, row2] = provider.variables.value;
    expect(row1.name.name.value).toBe('Same');
    expect(row2.name.name.value).toBe('same ');
    expect(row1.name.error.value).toBe('Duplicate variable name');
    expect(row2.name.error.value).toBe('Duplicate variable name');

    row2.name.name.value = 'other';
    expect(validateMatrixProvider(provider)).toBe(true);
    expect(row1.name.error.value).toBeUndefined();
  });

  test('secret to plain without re-entering the value is an error on the untouched cell only', () => {
    const provider = makeProvider([
      {
        id: 10,
        name: 'dev',
        variables: { secret: { value: 'shh', isSecret: true } },
      },
      {
        id: 20,
        name: 'prod',
        variables: { secret: { value: 'shh2', isSecret: true } },
      },
    ]);
    const row = provider.variables.value[0];
    expect(row.name.isSecret.value).toBe(true);

    row.name.isSecret.value = false;

    expect(validateMatrixProvider(provider)).toBe(false);
    expect(row.values[10].error.value).toBe(
      'Re-enter the value when converting a secret to plain text',
    );
    expect(row.values[20].error.value).toBe(
      'Re-enter the value when converting a secret to plain text',
    );

    // Re-entering the value for one group clears just that cell's error.
    row.values[10].value.value = 'now-visible';
    expect(validateMatrixProvider(provider)).toBe(false);
    expect(row.values[10].error.value).toBeUndefined();
    expect(row.values[20].error.value).toBe(
      'Re-enter the value when converting a secret to plain text',
    );

    row.values[20].value.value = 'now-visible2';
    expect(validateMatrixProvider(provider)).toBe(true);
  });

  test('mixed-secret row (initialValue null) flipped to plain errors only the originally-secret cells', () => {
    const provider = makeProvider([
      {
        id: 10,
        name: 'dev',
        variables: { mixed: { value: 'a', isSecret: true } },
      },
      {
        id: 20,
        name: 'prod',
        variables: { mixed: { value: 'b', isSecret: false } },
      },
    ]);
    const row = provider.variables.value[0];
    expect(row.name.isSecret.value).toBeNull(); // mixed secret flags -> null

    row.name.isSecret.value = false;

    expect(validateMatrixProvider(provider)).toBe(false);
    expect(row.values[10].error.value).toBe(
      'Re-enter the value when converting a secret to plain text',
    );
    expect(row.values[20].error.value).toBeUndefined(); // was already plain

    row.values[10].value.value = 'now-visible';
    expect(validateMatrixProvider(provider)).toBe(true);
  });

  test('renaming a row with an untouched present secret cell is an error on that cell only', () => {
    const provider = makeProvider([
      {
        id: 10,
        name: 'dev',
        variables: { secret: { value: 'shh', isSecret: true } },
      },
      {
        id: 20,
        name: 'prod',
        variables: { secret: { value: 'shh2', isSecret: false } },
      },
    ]);
    const row = provider.variables.value[0];
    expect(row.name.isSecret.value).toBeNull(); // mixed secret flags -> null

    row.name.name.value = 'renamed-secret';

    expect(validateMatrixProvider(provider)).toBe(false);
    expect(row.values[10].error.value).toBe(
      'Re-enter the value when renaming a secret variable',
    );
    expect(row.values[20].error.value).toBeUndefined(); // plain sibling untouched

    row.values[10].value.value = 'now-visible';
    expect(validateMatrixProvider(provider)).toBe(true);
  });

  test('a row deleted from every group does not block re-adding the same name', () => {
    const provider = makeProvider([
      {
        id: 10,
        name: 'dev',
        variables: { gone: { value: '1', isSecret: false } },
      },
    ]);
    const row = provider.variables.value[0];
    row.deleteVariable(10); // only cell deleted -> row.modified true, no present cells

    provider.addNewVariable();
    const added = provider.variables.value[1];
    added.name.name.value = 'gone';
    added.addValue(10);
    added.values[10].value.value = 'new-value';

    expect(validateMatrixProvider(provider)).toBe(true);
    expect(row.name.error.value).toBeUndefined();
    expect(added.name.error.value).toBeUndefined();
  });
});

describe('clearMatrixProviderErrors', () => {
  test('clears errors and resets states after reverting the edit that caused them', () => {
    const provider = makeProvider([
      {
        id: 10,
        name: 'dev',
        variables: {
          A: { value: '1', isSecret: false },
          B: { value: '2', isSecret: false },
        },
      },
    ]);
    const [rowA, rowB] = provider.variables.value;
    rowB.name.name.value = 'A'; // duplicate -> error on both

    expect(validateMatrixProvider(provider)).toBe(false);
    expect(rowA.name.error.value).toBe('Duplicate variable name');
    expect(rowB.name.error.value).toBe('Duplicate variable name');

    rowB.name.name.reset(); // revert the offending edit
    expect(provider.modified).toBe(false);

    clearMatrixProviderErrors(provider);
    expect(rowA.name.error.value).toBeUndefined();
    expect(rowB.name.error.value).toBeUndefined();
    expect(rowA.name.state.value.type).toBe('Unchanged');
    expect(rowB.name.state.value.type).toBe('Unchanged');
  });
});

describe('hasErrors integration (mapMatrixChanges)', () => {
  test('empty name on a new row with a changed cell surfaces via hasErrors', () => {
    const provider = makeProvider([{ id: 10, name: 'dev', variables: {} }]);
    provider.addNewVariable();
    const row = provider.variables.value[0];
    row.addValue(10);
    row.values[10].value.value = 'x';

    expect(validateMatrixProvider(provider)).toBe(false);
    expect(hasErrors(mapMatrixChanges(provider))).toBe(true);
  });

  test('renaming a row onto an untouched row marks both names errored and surfaces via hasErrors', () => {
    const provider = makeProvider([
      {
        id: 10,
        name: 'dev',
        variables: {
          A: { value: '1', isSecret: false },
          B: { value: '2', isSecret: false },
        },
      },
    ]);
    // Row order follows the object literal's key insertion order (A, B).
    const [rowA, rowB] = provider.variables.value;
    expect(rowA.name.name.value).toBe('A');
    expect(rowB.name.name.value).toBe('B');
    rowB.name.name.value = 'A'; // rename onto A, which itself is otherwise untouched

    expect(validateMatrixProvider(provider)).toBe(false);
    expect(rowA.name.error.value).toBe('Duplicate variable name');
    expect(rowB.name.error.value).toBe('Duplicate variable name');
    // Row A emits no change of its own (nothing edited on it) so its error
    // never reaches Save's gate — harmless since Save never touches it. Row
    // B's rename does emit a change, and it carries the duplicate error.
    expect(hasErrors(mapMatrixChanges(provider))).toBe(true);
  });

  test('a valid edit does not trip hasErrors', () => {
    const provider = makeProvider([
      {
        id: 10,
        name: 'dev',
        variables: { shared: { value: '1', isSecret: false } },
      },
    ]);
    provider.variables.value[0].values[10].value.value = 'new';

    expect(validateMatrixProvider(provider)).toBe(true);
    expect(hasErrors(mapMatrixChanges(provider))).toBe(false);
  });
});
