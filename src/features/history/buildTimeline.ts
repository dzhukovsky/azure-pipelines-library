import type { HistoryEntry, TimelineItem } from './models';

const sameInstant = (a?: string, b?: string) =>
  !!a && !!b && new Date(a).getTime() === new Date(b).getTime();

/**
 * entries: newest-first for ALL groups; currentModifiedOn: groupId -> ISO of the
 * group's current modifiedOn (from the variable-groups query).
 * Inserts an 'external' marker wherever the chain breaks:
 *  - latest entry of a group: entry.modifiedOnAfter !== currentModifiedOn[groupId]
 *  - consecutive entries of a group: older.modifiedOnAfter !== newer.modifiedOnBefore
 * Markers are placed immediately before (i.e. displayed above) the entry whose
 * "before" side is broken; a break at the head goes to the very top.
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

  return timeline;
};
