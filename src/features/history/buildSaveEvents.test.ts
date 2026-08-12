import { describe, expect, test } from 'bun:test';
import { buildSaveEvents } from './buildSaveEvents';
import type { HistoryEntry, TimelineItem } from './models';

const entry = (over: Partial<HistoryEntry>): HistoryEntry => ({
  id: over.id ?? 'id',
  timestamp: over.timestamp ?? '2026-01-02T00:00:00Z',
  actor: { id: 'u', displayName: 'User' },
  groupId: 1,
  groupName: 'g',
  changes: [{ key: 'a', status: 'modified' }],
  ...over,
});

const asItem = (e: HistoryEntry): TimelineItem => ({ kind: 'entry', entry: e });

describe('buildSaveEvents', () => {
  test('entries of one save batch collapse into a single event', () => {
    const a = entry({ id: 'a', groupId: 1, groupName: 'dev' });
    const b = entry({ id: 'b', groupId: 2, groupName: 'prod' });

    const items = buildSaveEvents([asItem(a), asItem(b)]);

    expect(items).toHaveLength(1);
    const event = items[0];
    if (event.kind !== 'save') throw new Error('expected save event');
    expect(event.key).toBe('a');
    expect(event.entries.map((e) => e.groupName)).toEqual(['dev', 'prod']);
  });

  test('different timestamps produce separate events', () => {
    const newer = entry({ id: 'n', timestamp: '2026-01-02T00:00:00Z' });
    const older = entry({ id: 'o', timestamp: '2026-01-01T00:00:00Z' });

    const items = buildSaveEvents([asItem(newer), asItem(older)]);

    expect(items.map((i) => i.kind)).toEqual(['save', 'save']);
  });

  test('different actors at the same timestamp stay separate', () => {
    const a = entry({ id: 'a' });
    const b = entry({ id: 'b', actor: { id: 'other', displayName: 'Other' } });

    const items = buildSaveEvents([asItem(a), asItem(b)]);

    expect(items.map((i) => i.kind)).toEqual(['save', 'save']);
  });

  test('external markers pass through with stable keys and split a batch', () => {
    const a = entry({ id: 'a', groupId: 1 });
    const b = entry({ id: 'b', groupId: 2 });

    const items = buildSaveEvents([
      asItem(a),
      { kind: 'external', groupId: 2, groupName: 'prod' },
      asItem(b),
    ]);

    expect(items.map((i) => i.kind)).toEqual(['save', 'external', 'save']);
    const external = items[1];
    if (external.kind !== 'external') throw new Error('expected external');
    expect(external.key).toBe('external-2-b');
    expect(external.groupName).toBe('prod');
  });
});
