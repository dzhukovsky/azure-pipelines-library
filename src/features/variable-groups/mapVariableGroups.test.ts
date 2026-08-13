import { describe, expect, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { mapVariableGroups } from './mapVariableGroups';

const group = (over: Partial<VariableGroup> = {}): VariableGroup =>
  ({
    id: 1,
    name: 'group-1',
    variables: {},
    ...over,
  }) as VariableGroup;

describe('mapVariableGroups', () => {
  test('maps id, name and identity/date fields onto the model', () => {
    const modifiedOn = new Date('2020-01-01');
    const modifiedBy = { id: 'u1', displayName: 'Alice' };

    const [model] = mapVariableGroups([
      group({ id: 7, name: 'db', modifiedBy, modifiedOn } as Partial<VariableGroup>),
    ]);

    expect(model.id).toBe(7);
    expect(model.name.value).toBe('db');
    expect(model.modifiedOn).toBe(modifiedOn);
    expect(model.modifiedBy).toBe(modifiedBy);
    expect(model.modified).toBe(false);
  });

  test('maps each variable, defaulting isSecret to false', () => {
    const [model] = mapVariableGroups([
      group({
        variables: {
          plain: { value: 'v', isSecret: false },
          secret: { value: null, isSecret: true },
          untyped: { value: 'x' },
        },
      } as unknown as VariableGroup),
    ]);

    const byName = Object.fromEntries(
      model.variables.value.map((v) => [v.name.value, v]),
    );
    expect(byName.plain.isSecret.value).toBe(false);
    expect(byName.secret.isSecret.value).toBe(true);
    expect(byName.untyped.isSecret.value).toBe(false);
    expect(model.variables.value).toHaveLength(3);
  });

  test('falls back to createdBy/createdOn when modified* is absent', () => {
    const createdOn = new Date('2019-05-05');
    const createdBy = { id: 'c1', displayName: 'Creator' };

    const [model] = mapVariableGroups([
      group({ createdBy, createdOn } as Partial<VariableGroup>),
    ]);

    expect(model.modifiedOn).toBe(createdOn);
    expect(model.modifiedBy).toBe(createdBy);
  });
});
