import type { HistoryEntry, TimelineItem } from './models';

export type SaveEventItem = {
  kind: 'save';
  /** Stable render key — the first entry's id. */
  key: string;
  timestamp: string;
  actor: HistoryEntry['actor'];
  /** One entry per affected group, in timeline order. */
  entries: HistoryEntry[];
};

export type ExternalItem = {
  kind: 'external';
  key: string;
  groupId: number;
  groupName: string;
  detectedAt?: string;
};

export type HistoryListItem = SaveEventItem | ExternalItem;

/**
 * Folds the flat, newest-first timeline into one row per save event: entries
 * recorded by the same save share a single timestamp and actor (see
 * buildHistoryEntries), so consecutive entries with that pair collapse into
 * one expandable item. External markers pass through as standalone rows; a
 * marker landing between two entries of the same batch intentionally splits
 * the batch, keeping the display chronologically honest.
 */
export const buildSaveEvents = (
  timeline: TimelineItem[],
): HistoryListItem[] => {
  const items: HistoryListItem[] = [];

  timeline.forEach((item, index) => {
    if (item.kind === 'external') {
      // Every external marker is immediately followed by the entry that
      // triggered it (buildTimeline invariant) — its id makes a stable key.
      const next = timeline[index + 1] as Extract<
        TimelineItem,
        { kind: 'entry' }
      >;
      items.push({
        kind: 'external',
        key: `external-${item.groupId}-${next.entry.id}`,
        groupId: item.groupId,
        groupName: item.groupName,
        detectedAt: item.detectedAt,
      });
      return;
    }

    const last = items[items.length - 1];
    if (
      last?.kind === 'save' &&
      last.timestamp === item.entry.timestamp &&
      last.actor.id === item.entry.actor.id
    ) {
      last.entries.push(item.entry);
      return;
    }

    items.push({
      kind: 'save',
      key: item.entry.id,
      timestamp: item.entry.timestamp,
      actor: item.entry.actor,
      entries: [item.entry],
    });
  });

  return items;
};
