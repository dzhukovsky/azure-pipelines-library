import type { HistoryEntry, TimelineItem } from './models';

const sameInstant = (a?: string, b?: string) =>
  !!a && !!b && new Date(a).getTime() === new Date(b).getTime();

/**
 * entries: newest-first for ALL groups; currentModifiedOn: groupId -> ISO of the
 * group's current modifiedOn (from the variable-groups query).
 * Inserts an 'external' marker wherever the chain breaks:
 *  - latest entry of a group: entry.modifiedOnAfter !== currentModifiedOn[groupId]
 *  - consecutive entries of a group: older.modifiedOnAfter !== newer.modifiedOnBefore
 * Markers are detected next to the entry whose chain they break, then the whole
 * list is ordered newest-first by when things actually happened — an external
 * change is dated by the modifiedOn that revealed it, so it sorts among the
 * saves of every other group rather than only within its own chain.
 */
export const buildTimeline = (
  entries: HistoryEntry[],
  currentModifiedOn: Record<number, string | undefined>,
): TimelineItem[] => {
  const timeline: TimelineItem[] = [];
  // Newest entry already seen per group (we iterate newest -> oldest).
  const seenNewerOfGroup = new Map<number, HistoryEntry>();

  for (const entry of entries) {
    const newer = seenNewerOfGroup.get(entry.groupId);

    if (!newer) {
      // Head of this group's chain: compare with the live modifiedOn.
      const current = currentModifiedOn[entry.groupId];
      if (current && !sameInstant(entry.modifiedOnAfter, current)) {
        timeline.push({
          kind: 'external',
          groupId: entry.groupId,
          groupName: entry.groupName,
          detectedAt: current,
        });
      }
    } else if (!sameInstant(entry.modifiedOnAfter, newer.modifiedOnBefore)) {
      timeline.push({
        kind: 'external',
        groupId: entry.groupId,
        groupName: entry.groupName,
        detectedAt: newer.modifiedOnBefore,
      });
    }

    timeline.push({ kind: 'entry', entry });
    seenNewerOfGroup.set(entry.groupId, entry);
  }

  // A marker with no detected time has nothing of its own to sort by; it was
  // inserted directly above the entry it belongs to, so it borrows that
  // entry's time and the stable sort keeps it there.
  const timeOf = (item: TimelineItem, index: number): number => {
    if (item.kind === 'entry') {
      return Date.parse(item.entry.timestamp);
    }
    if (item.detectedAt) {
      return Date.parse(item.detectedAt);
    }
    const next = timeline[index + 1];
    return next?.kind === 'entry' ? Date.parse(next.entry.timestamp) : 0;
  };

  return timeline
    .map((item, index) => ({ item, time: timeOf(item, index) }))
    .sort((a, b) => b.time - a.time)
    .map(({ item }) => item);
};
