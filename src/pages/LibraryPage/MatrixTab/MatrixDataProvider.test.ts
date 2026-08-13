import { describe, expect, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { MatrixDataProvider } from './MatrixDataProvider';

const makeProvider = () =>
  new MatrixDataProvider([
    {
      id: 10,
      name: 'dev',
      variables: { existing: { value: '1', isSecret: false } },
    },
  ] as unknown as VariableGroup[]);

describe('MatrixDataProvider', () => {
  test('addNewVariable appends at the end and returns the new variable', () => {
    const provider = makeProvider();

    const added = provider.addNewVariable();

    expect(provider.variables.value[1]).toBe(added);
    expect(provider.variables.value).toHaveLength(2);
  });
});
