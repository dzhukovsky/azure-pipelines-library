import { describe, expect, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import type { SaveOutcome } from '@/features/save-changes/saveLibraryChanges';
import { States } from '@/shared/components/StateIcon';
import type { HistoryEntry, HistorySaveEntry } from './models';
import { buildHistoryEntries } from './recordSaveHistory';

const actor = { id: 'u1', displayName: 'User' };

const outcome: SaveOutcome = {
  ok: false,
  results: [
    {
      groupId: 1,
      groupName: 'g',
      ok: true,
      nameBefore: 'g',
      modifiedOnBefore: new Date('2026-01-01T00:00:00Z'),
      updated: { modifiedOn: new Date('2026-01-02T00:00:00Z') } as VariableGroup,
      changes: [
        { key: 'a', valueChanged: true, value: 'x', isSecret: false, isSecretChanged: false, state: States.New },
        { key: 'renamed', previousKey: 'old', valueChanged: false, isSecret: false, isSecretChanged: false, state: States.Modified },
        { key: 'gone', valueChanged: false, isSecret: false, isSecretChanged: false, state: States.Deleted },
        { key: 'new', previousKey: 'old2', valueChanged: false, isSecret: false, isSecretChanged: false, state: States.Deleted },
      ],
    },
    { groupId: 2, groupName: 'failed', ok: false, error: 'boom' },
  ],
};

const previousSave = (modifiedOnAfter: string): HistorySaveEntry => ({
  kind: 'save',
  id: 'previous',
  timestamp: '2025-12-31T00:00:00Z',
  actor,
  groupId: 1,
  groupName: 'g',
  modifiedOnAfter,
  changes: [],
});

const saveEntries = (entries: HistoryEntry[]) =>
  entries.filter((e): e is HistorySaveEntry => e.kind === 'save');

describe('buildHistoryEntries', () => {
  test('maps only successful groups, keys and statuses only — never values', () => {
    const entries = buildHistoryEntries(
      outcome,
      actor,
      '2026-01-02T00:00:01Z',
      () => 'fixed-id',
    );

    expect(entries).toHaveLength(1);
    const e = saveEntries(entries)[0];
    expect(e.groupId).toBe(1);
    expect(e.modifiedOnBefore).toBe('2026-01-01T00:00:00.000Z');
    expect(e.modifiedOnAfter).toBe('2026-01-02T00:00:00.000Z');
    expect(e.changes).toEqual([
      { key: 'a', status: 'added', renamedTo: undefined },
      { key: 'old', status: 'renamed', renamedTo: 'renamed' },
      { key: 'gone', status: 'deleted', renamedTo: undefined },
      // Deleted after being renamed: the server never saw the new name, so
      // history must record the key the entry actually had on the server.
      { key: 'old2', status: 'deleted', renamedTo: undefined },
    ]);
    expect(JSON.stringify(e)).not.toContain('"x"'); // no variable values stored
  });

  test('records the change we found on the way in, with its own author', () => {
    const outcomeWithExternal: SaveOutcome = {
      ok: true,
      results: [
        {
          ...(outcome.results[0] as Extract<
            SaveOutcome['results'][number],
            { ok: true }
          >),
          modifiedByBefore: { id: 'someone', displayName: 'Someone Else' },
        },
      ],
    };

    // The group last left our hands at 12-31, but arrived at 01-01.
    const entries = buildHistoryEntries(
      outcomeWithExternal,
      actor,
      '2026-01-02T00:00:01Z',
      () => 'fixed-id',
      [previousSave('2025-12-31T00:00:00.000Z')],
    );

    expect(entries.map((e) => e.kind)).toEqual(['save', 'external']);
    expect(entries[1]).toEqual({
      kind: 'external',
      id: 'fixed-id',
      timestamp: '2026-01-01T00:00:00.000Z',
      actor: { id: 'someone', displayName: 'Someone Else' },
      groupId: 1,
      groupName: 'g',
      modifiedOn: '2026-01-01T00:00:00.000Z',
    });
  });

  test('a group we left exactly as we found it records nothing extra', () => {
    const entries = buildHistoryEntries(
      outcome,
      actor,
      '2026-01-02T00:00:01Z',
      () => 'fixed-id',
      [previousSave('2026-01-01T00:00:00.000Z')],
    );

    expect(entries.map((e) => e.kind)).toEqual(['save']);
  });

  test('a group saved for the first time has nothing to compare against', () => {
    const entries = buildHistoryEntries(
      outcome,
      actor,
      '2026-01-02T00:00:01Z',
      () => 'fixed-id',
      [],
    );

    expect(entries.map((e) => e.kind)).toEqual(['save']);
  });

  test('renaming the group is recorded on the entry', () => {
    const renamed: SaveOutcome = {
      ok: true,
      results: [
        {
          ...(outcome.results[0] as Extract<
            SaveOutcome['results'][number],
            { ok: true }
          >),
          groupName: 'new name',
          nameBefore: 'old name',
        },
      ],
    };

    const entries = buildHistoryEntries(
      renamed,
      actor,
      '2026-01-02T00:00:01Z',
      () => 'fixed-id',
    );

    expect(saveEntries(entries)[0]).toMatchObject({
      groupName: 'new name',
      renamedFrom: 'old name',
    });
  });
});
