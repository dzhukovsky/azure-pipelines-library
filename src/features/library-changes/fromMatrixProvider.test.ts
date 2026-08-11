import { describe, expect, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { MatrixDataProvider } from '@/pages/LibraryPage/MatrixTab/MatrixDataProvider';
import { getChangeStatus } from './types';
import { mapMatrixChanges } from './fromMatrixProvider';

const makeProvider = () => {
  const groups = [
    {
      id: 10,
      name: 'dev',
      modifiedOn: new Date('2026-01-01T00:00:00Z'),
      variables: { shared: { value: '1', isSecret: false } },
    },
    {
      id: 20,
      name: 'prod',
      modifiedOn: new Date('2026-01-02T00:00:00Z'),
      variables: { shared: { value: '2', isSecret: false } },
    },
  ] as unknown as VariableGroup[];
  return new MatrixDataProvider(groups);
};

describe('mapMatrixChanges', () => {
  test('cell edit produces a change only in that group', () => {
    const provider = makeProvider();
    const row = provider.variables.value[0];
    row.values[20].value.value = 'new';

    const changes = mapMatrixChanges(provider);
    expect(changes.groups.map((g) => g.groupId)).toEqual([20]);
    const v = changes.groups[0].variables[0];
    expect(v.key).toBe('shared');
    expect(v.valueChanged).toBe(true);
    expect(v.value).toBe('new');
  });

  test('rename fans out to every present cell as renamed', () => {
    const provider = makeProvider();
    const row = provider.variables.value[0];
    row.name.name.value = 'sharedRenamed';

    const changes = mapMatrixChanges(provider);
    expect(changes.groups.map((g) => g.groupId).sort()).toEqual([10, 20]);
    for (const g of changes.groups) {
      const v = g.variables[0];
      expect(getChangeStatus(v)).toBe('renamed');
      expect(v.previousKey).toBe('shared');
      expect(v.key).toBe('sharedRenamed');
      expect(v.valueChanged).toBe(false);
    }
  });

  test('new row with one added cell affects only that group', () => {
    const provider = makeProvider();
    provider.addNewVariable();
    const row = provider.variables.value[1];
    row.name.name.value = 'brand';
    row.addValue(10);
    row.values[10].value.value = 'x';

    const changes = mapMatrixChanges(provider);
    expect(changes.groups.map((g) => g.groupId)).toEqual([10]);
    expect(getChangeStatus(changes.groups[0].variables[0])).toBe('added');
  });

  test('deleting a cell is a deletion in that group only', () => {
    const provider = makeProvider();
    provider.variables.value[0].deleteVariable(10);

    const changes = mapMatrixChanges(provider);
    expect(changes.groups.map((g) => g.groupId)).toEqual([10]);
    expect(getChangeStatus(changes.groups[0].variables[0])).toBe('deleted');
  });
});
