// src/features/save-changes/buildGroupUpdate.test.ts
import { describe, expect, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import type { GroupChange } from '@/features/library-editing';
import { States } from '@/shared/components/StateIcon';
import {
  buildVariableGroupParameters,
  GroupConflictError,
} from './buildGroupUpdate';

const MODIFIED_ON = new Date('2026-01-01T00:00:00Z');

const currentGroup = () =>
  ({
    id: 1,
    name: 'group',
    description: 'desc',
    type: 'Vsts',
    providerData: undefined,
    modifiedOn: MODIFIED_ON,
    variableGroupProjectReferences: [{ name: 'group' }],
    variables: {
      keep: { value: 'kept', isSecret: false },
      secret: { isSecret: true }, // value undefined — never returned
      old: { value: '1', isSecret: false },
      gone: { value: 'x', isSecret: false },
    },
  }) as unknown as VariableGroup;

const baseChange = (variables: GroupChange['variables']): GroupChange => ({
  groupId: 1,
  name: 'group',
  nameChanged: false,
  modifiedOnSnapshot: MODIFIED_ON,
  state: States.Modified,
  variables,
});

describe('buildVariableGroupParameters', () => {
  test('applies delete, rename, add and edit while preserving untouched entries', () => {
    const params = buildVariableGroupParameters(
      currentGroup(),
      baseChange([
        {
          key: 'gone',
          valueChanged: false,
          isSecret: false,
          isSecretChanged: false,
          state: States.Deleted,
        },
        {
          key: 'renamed',
          previousKey: 'old',
          valueChanged: false,
          isSecret: false,
          isSecretChanged: false,
          state: States.Modified,
        },
        {
          key: 'fresh',
          value: 'v',
          valueChanged: true,
          isSecret: false,
          isSecretChanged: false,
          state: States.New,
        },
      ]),
    );

    expect(params.variables).toEqual({
      keep: { value: 'kept', isSecret: false },
      secret: { isSecret: true },
      renamed: { value: '1', isSecret: false, isReadOnly: false },
      fresh: { value: 'v', isSecret: false, isReadOnly: false },
    });
  });

  test('untouched secret keeps undefined value; edited secret sends the new value', () => {
    const params = buildVariableGroupParameters(
      currentGroup(),
      baseChange([
        {
          key: 'secret',
          valueChanged: false,
          isSecret: true,
          isSecretChanged: false,
          state: States.Modified,
        },
      ]),
    );
    expect(params.variables.secret).toEqual({
      value: undefined,
      isSecret: true,
      isReadOnly: false,
    });

    const edited = buildVariableGroupParameters(
      currentGroup(),
      baseChange([
        {
          key: 'secret',
          value: 'new',
          valueChanged: true,
          isSecret: true,
          isSecretChanged: false,
          state: States.Modified,
        },
      ]),
    );
    expect(edited.variables.secret).toEqual({
      value: 'new',
      isSecret: true,
      isReadOnly: false,
    });
  });

  test('deleting a variable that was renamed first removes the server-side key', () => {
    const params = buildVariableGroupParameters(
      currentGroup(),
      baseChange([
        {
          key: 'newName',
          previousKey: 'old',
          valueChanged: false,
          isSecret: false,
          isSecretChanged: false,
          state: States.Deleted,
        },
      ]),
    );
    expect(params.variables.old).toBeUndefined();
    expect(params.variables.newName).toBeUndefined();
  });

  test('throws GroupConflictError when server copy is newer than the snapshot', () => {
    const change = baseChange([]);
    change.modifiedOnSnapshot = new Date('2025-12-31T00:00:00Z');
    expect(() => buildVariableGroupParameters(currentGroup(), change)).toThrow(
      GroupConflictError,
    );
  });

  test('carries group metadata and renames the group in its project too', () => {
    const change = baseChange([]);
    change.name = 'newName';
    change.nameChanged = true;
    const params = buildVariableGroupParameters(currentGroup(), change);
    expect(params.name).toBe('newName');
    expect(params.description).toBe('desc');
    expect(params.type).toBe('Vsts');
    // The project reference carries the name a project-scoped group shows.
    expect(params.variableGroupProjectReferences).toEqual([
      { name: 'newName' },
    ]);
  });

  test('leaves the project references alone when the name is untouched', () => {
    const params = buildVariableGroupParameters(currentGroup(), baseChange([]));
    expect(params.variableGroupProjectReferences).toEqual([{ name: 'group' }]);
  });
});
