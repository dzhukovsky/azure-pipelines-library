import { describe, expect, mock, test } from 'bun:test';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import type { GroupChange, LibraryChanges } from '@/features/library-changes';
import { GroupConflictError } from './buildGroupUpdate';
import {
  saveLibraryChanges,
  type SaveLibraryClient,
} from './saveLibraryChanges';

const group = (over: Partial<GroupChange> = {}): GroupChange => ({
  groupId: 1,
  name: 'group-1',
  nameChanged: false,
  state: { type: 'Modified' },
  variables: [],
  ...over,
});

const changes = (...groups: GroupChange[]): LibraryChanges => ({
  groups,
  files: [],
});

const serverGroup = (over: Partial<VariableGroup> = {}): VariableGroup =>
  ({
    id: 1,
    name: 'group-1',
    variables: {},
    ...over,
  }) as VariableGroup;

const client = (over: Partial<SaveLibraryClient> = {}): SaveLibraryClient => ({
  getVariableGroupById: mock(async (id: number) => serverGroup({ id })),
  updateVariableGroupById: mock(async (id: number) => serverGroup({ id })),
  ...over,
});

describe('saveLibraryChanges', () => {
  test('saves every group and reports ok when all succeed', async () => {
    const c = client();

    const outcome = await saveLibraryChanges(
      changes(group({ groupId: 1 }), group({ groupId: 2, name: 'group-2' })),
      c,
    );

    expect(outcome.ok).toBe(true);
    expect(outcome.results).toHaveLength(2);
    expect(outcome.results.every((r) => r.ok)).toBe(true);
    expect(c.updateVariableGroupById).toHaveBeenCalledTimes(2);
  });

  test('a failing group does not stop the others (partial success)', async () => {
    const c = client({
      updateVariableGroupById: mock(async (groupId: number, _params) => {
        if (groupId === 1) throw new Error('boom');
        return serverGroup({ id: groupId });
      }),
    });

    const outcome = await saveLibraryChanges(
      changes(group({ groupId: 1 }), group({ groupId: 2, name: 'group-2' })),
      c,
    );

    expect(outcome.ok).toBe(false);
    const [first, second] = outcome.results;
    expect(first.ok).toBe(false);
    expect(first.ok === false && first.error).toBe('boom');
    expect(second.ok).toBe(true);
  });

  test('maps a concurrency conflict to a friendly message', async () => {
    const c = client({
      getVariableGroupById: mock(async (id: number) =>
        serverGroup({ id, modifiedOn: new Date('2020-01-02') }),
      ),
    });

    const outcome = await saveLibraryChanges(
      changes(group({ modifiedOnSnapshot: new Date('2020-01-01') })),
      c,
    );

    expect(outcome.ok).toBe(false);
    const [result] = outcome.results;
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain(
      'modified outside this session',
    );
    // Conflict is detected before the write is attempted.
    expect(c.updateVariableGroupById).not.toHaveBeenCalled();
  });

  test('conflict errors are surfaced (GroupConflictError is an Error)', () => {
    expect(new GroupConflictError(1, 'g')).toBeInstanceOf(Error);
  });

  test('stringifies a non-Error throw', async () => {
    const c = client({
      getVariableGroupById: mock(async () => {
        throw 'plain string failure';
      }),
    });

    const outcome = await saveLibraryChanges(changes(group()), c);

    const [result] = outcome.results;
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toBe('plain string failure');
  });
});
