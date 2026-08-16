import type { HistoryActor, HistorySaveEntry, TimelineItem } from './models';

export type SaveEventItem = {
  kind: 'save';
  /** Stable render key — the first entry's id. */
  key: string;
  timestamp: string;
  actor: HistoryActor;
  /** One entry per affected group, in timeline order. */
  entries: HistorySaveEntry[];
};

export type ExternalItem = {
  kind: 'external';
  key: string;
  groupId: number;
  groupName: string;
  detectedAt?: string;
  /** Recorded with the change; a live marker has none. */
  actor?: HistoryActor;
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
  const markersPerGroup = new Map<number, number>();

  timeline.forEach((item) => {
    if (item.kind === 'external') {
      // A group can break more than once, and markers can end up adjacent
      // once the timeline is ordered by time, so key them by what makes one
      // marker distinct: its group and when the change was detected.
      const seen = (markersPerGroup.get(item.groupId) ?? 0) + 1;
      markersPerGroup.set(item.groupId, seen);
      items.push({
        kind: 'external',
        key: `external-${item.groupId}-${item.detectedAt ?? seen}`,
        groupId: item.groupId,
        groupName: item.groupName,
        detectedAt: item.detectedAt,
        actor: item.actor,
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
