import { describe, expect, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import {
  ObservableVariable,
  ObservableVariableGroup,
} from '@/features/variable-groups/models';
import { HomeTabModel } from '@/pages/LibraryPage/HomeTab/HomeTabModel';
import { MatrixDataProvider } from '@/pages/LibraryPage/MatrixTab/MatrixDataProvider';
import { validateHomeModel, validateMatrixProvider } from './validate';

const makeModel = (variables: ObservableVariable[]) =>
  new HomeTabModel(
    [new ObservableVariableGroup(1, 'g', variables, false)],
    [],
  );

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
      { id: 10, name: 'dev', variables: { Same: { value: '1', isSecret: false } } },
      { id: 20, name: 'prod', variables: { 'same ': { value: '2', isSecret: false } } },
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
      { id: 10, name: 'dev', variables: { secret: { value: 'shh', isSecret: true } } },
      { id: 20, name: 'prod', variables: { secret: { value: 'shh2', isSecret: true } } },
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
});
