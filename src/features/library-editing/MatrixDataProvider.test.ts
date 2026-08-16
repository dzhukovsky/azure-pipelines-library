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

  test('a variable named __proto__ does not pollute Object.prototype', () => {
    const group = JSON.parse(
      '{"id":10,"name":"dev","variables":{"__proto__":{"value":"x","isSecret":false}}}',
    );

    new MatrixDataProvider([group] as unknown as VariableGroup[]);

    expect(({} as Record<string, unknown>)['10']).toBeUndefined();
  });
});
