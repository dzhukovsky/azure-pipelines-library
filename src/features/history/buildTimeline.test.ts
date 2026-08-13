import { describe, expect, test } from 'bun:test';
import { buildTimeline } from './buildTimeline';
import type { HistoryExternalEntry, HistorySaveEntry } from './models';

const entry = (over: Partial<HistorySaveEntry>): HistorySaveEntry => ({
  kind: 'save',
  id: over.id ?? 'id',
  timestamp: over.timestamp ?? '2026-01-02T00:00:00Z',
  actor: { id: 'u', displayName: 'User' },
  groupId: 1,
  groupName: 'g',
  changes: [{ key: 'a', status: 'modified' }],
  ...over,
});

const external = (
  over: Partial<HistoryExternalEntry>,
): HistoryExternalEntry => ({
  kind: 'external',
  id: over.id ?? 'ext',
  timestamp: over.modifiedOn ?? '2026-01-03T00:00:00Z',
  actor: { id: 'other', displayName: 'Other' },
  groupId: 1,
  groupName: 'g',
  modifiedOn: over.modifiedOn ?? '2026-01-03T00:00:00Z',
  ...over,
});

describe('buildTimeline', () => {
  test('continuous chain produces no markers', () => {
    const entries = [
      entry({
        id: '2',
        timestamp: '2026-01-02T00:00:00Z',
        modifiedOnBefore: '2026-01-01T00:00:00Z',
        modifiedOnAfter: '2026-01-02T00:00:00Z',
      }),
      entry({
        id: '1',
        timestamp: '2026-01-01T00:00:00Z',
        modifiedOnBefore: '2025-12-31T00:00:00Z',
        modifiedOnAfter: '2026-01-01T00:00:00Z',
      }),
    ];
    const timeline = buildTimeline(entries, { 1: '2026-01-02T00:00:00Z' });
    expect(timeline.map((t) => t.kind)).toEqual(['entry', 'entry']);
  });

  test('a recorded external change becomes a marker of its own', () => {
    const entries = [
      entry({
        id: 'after',
        timestamp: '2026-01-04T00:00:00Z',
        modifiedOnBefore: '2026-01-03T00:00:00Z',
        modifiedOnAfter: '2026-01-04T00:00:00Z',
      }),
      external({ id: 'ext', modifiedOn: '2026-01-03T00:00:00Z' }),
      entry({
        id: 'before',
        timestamp: '2026-01-01T00:00:00Z',
        modifiedOnBefore: '2025-12-31T00:00:00Z',
        modifiedOnAfter: '2026-01-01T00:00:00Z',
      }),
    ];

    const timeline = buildTimeline(entries, { 1: '2026-01-04T00:00:00Z' });

    expect(timeline.map((t) => t.kind)).toEqual(['entry', 'external', 'entry']);
    // Its own actor, not whoever last touched the group.
    expect(timeline[1]).toEqual({
      kind: 'external',
      groupId: 1,
      groupName: 'g',
      detectedAt: '2026-01-03T00:00:00Z',
      actor: { id: 'other', displayName: 'Other' },
    });
  });

  test('markers are ordered by when the external change happened', () => {
    const entries = [
      entry({
        id: 'newer',
        groupId: 1,
        timestamp: '2026-01-05T00:00:00Z',
        modifiedOnBefore: '2026-01-04T00:00:00Z',
        modifiedOnAfter: '2026-01-05T00:00:00Z',
      }),
      entry({
        id: 'older',
        groupId: 2,
        groupName: 'other',
        timestamp: '2026-01-01T00:00:00Z',
        modifiedOnBefore: '2025-12-31T00:00:00Z',
        modifiedOnAfter: '2026-01-01T00:00:00Z',
      }),
    ];

    // Group 2 was touched outside the extension after both saves, so its
    // marker belongs above group 1's newer entry, not next to its own.
    const timeline = buildTimeline(entries, {
      1: '2026-01-05T00:00:00Z',
      2: '2026-01-09T00:00:00Z',
    });

    expect(timeline.map((t) => t.kind)).toEqual(['external', 'entry', 'entry']);
    expect(timeline[0]).toMatchObject({
      groupId: 2,
      detectedAt: '2026-01-09T00:00:00Z',
    });
    expect(timeline[1]).toMatchObject({ entry: { id: 'newer' } });
  });

  test('current modifiedOn ahead of the newest entry inserts a live marker', () => {
    const entries = [
      entry({
        id: '1',
        modifiedOnBefore: '2026-01-01T00:00:00Z',
        modifiedOnAfter: '2026-01-02T00:00:00Z',
      }),
    ];
    const timeline = buildTimeline(entries, { 1: '2026-02-01T00:00:00Z' });
    // No actor: nobody recorded this one yet, so the view reads it off the group.
    expect(timeline[0]).toEqual({
      kind: 'external',
      groupId: 1,
      groupName: 'g',
      detectedAt: '2026-02-01T00:00:00Z',
    });
    expect(timeline[1].kind).toBe('entry');
  });

  test('a recorded external change accounts for the group as it stands now', () => {
    const entries = [external({ modifiedOn: '2026-01-03T00:00:00Z' })];

    const timeline = buildTimeline(entries, { 1: '2026-01-03T00:00:00Z' });

    expect(timeline.map((t) => t.kind)).toEqual(['external']);
  });

  test('groups are tracked independently', () => {
    const entries = [
      entry({
        id: 'b',
        groupId: 2,
        groupName: 'other',
        modifiedOnBefore: '2026-01-01T00:00:00Z',
        modifiedOnAfter: '2026-01-03T00:00:00Z',
      }),
      entry({
        id: 'a',
        groupId: 1,
        modifiedOnBefore: '2026-01-01T00:00:00Z',
        modifiedOnAfter: '2026-01-02T00:00:00Z',
      }),
    ];
    const timeline = buildTimeline(entries, {
      1: '2026-01-02T00:00:00Z', // group 1 clean
      2: '2026-01-09T00:00:00Z', // group 2 changed externally after our save
    });
    expect(timeline.map((t) => t.kind)).toEqual(['external', 'entry', 'entry']);
    expect((timeline[0] as { groupId: number }).groupId).toBe(2);
  });

  test('unknown current modifiedOn (group deleted or not loaded) adds no marker', () => {
    const entries = [entry({ modifiedOnAfter: '2026-01-02T00:00:00Z' })];
    expect(buildTimeline(entries, {}).map((t) => t.kind)).toEqual(['entry']);
  });
});
