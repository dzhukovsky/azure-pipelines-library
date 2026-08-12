import { describe, expect, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { States } from '@/shared/components/StateIcon';
import type { SaveOutcome } from '@/features/save-changes/saveLibraryChanges';
import { buildHistoryEntries } from './recordSaveHistory';

const outcome: SaveOutcome = {
  ok: false,
  results: [
    {
      groupId: 1,
      groupName: 'g',
      ok: true,
      modifiedOnBefore: new Date('2026-01-01T00:00:00Z'),
      updated: { modifiedOn: new Date('2026-01-02T00:00:00Z') } as VariableGroup,
      changes: [
        { key: 'a', valueChanged: true, value: 'x', isSecret: false, isSecretChanged: false, state: States.New },
        { key: 'renamed', previousKey: 'old', valueChanged: false, isSecret: false, isSecretChanged: false, state: States.Modified },
        { key: 'gone', valueChanged: false, isSecret: false, isSecretChanged: false, state: States.Deleted },
      ],
    },
    { groupId: 2, groupName: 'failed', ok: false, error: 'boom' },
  ],
};

describe('buildHistoryEntries', () => {
  test('maps only successful groups, keys and statuses only — never values', () => {
    const entries = buildHistoryEntries(
      outcome,
      { id: 'u1', displayName: 'User' },
      '2026-01-02T00:00:01Z',
      () => 'fixed-id',
    );

    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e.groupId).toBe(1);
    expect(e.modifiedOnBefore).toBe('2026-01-01T00:00:00.000Z');
    expect(e.modifiedOnAfter).toBe('2026-01-02T00:00:00.000Z');
    expect(e.changes).toEqual([
      { key: 'a', status: 'added', renamedTo: undefined },
      { key: 'old', status: 'renamed', renamedTo: 'renamed' },
      { key: 'gone', status: 'deleted', renamedTo: undefined },
    ]);
    expect(JSON.stringify(e)).not.toContain('"x"'); // no variable values stored
  });
});
