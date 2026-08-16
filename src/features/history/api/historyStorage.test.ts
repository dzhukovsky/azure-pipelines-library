import { describe, expect, test } from 'bun:test';
import type { HistoryEntry } from '../models';
import { MAX_HISTORY_ENTRIES, mergeHistoryEntries } from './historyStorage';

const entry = (id: string): HistoryEntry =>
  ({
    kind: 'external',
    id,
    timestamp: '2020-01-01T00:00:00.000Z',
    groupId: 1,
    groupName: 'g',
    modifiedOn: '2020-01-01T00:00:00.000Z',
  }) as HistoryEntry;

describe('mergeHistoryEntries', () => {
  test('places added entries in front of existing ones', () => {
    const merged = mergeHistoryEntries([entry('old')], [entry('new')]);

    expect(merged.map((e) => e.id)).toEqual(['new', 'old']);
  });

  test('prunes the tail to MAX_HISTORY_ENTRIES', () => {
    const existing = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) =>
      entry(`old-${i}`),
    );

    const merged = mergeHistoryEntries(existing, [entry('new')]);

    expect(merged).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(merged[0].id).toBe('new');
    // The oldest tail entry is dropped.
    expect(merged.at(-1)?.id).toBe(`old-${MAX_HISTORY_ENTRIES - 2}`);
  });
});
