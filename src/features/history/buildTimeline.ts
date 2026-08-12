import { entryModifiedOn, type HistoryEntry, type TimelineItem } from './models';

const sameInstant = (a?: string, b?: string) =>
  !!a && !!b && new Date(a).getTime() === new Date(b).getTime();

/**
 * entries: newest-first for ALL groups; currentModifiedOn: groupId -> ISO of the
 * group's current modifiedOn (from the variable-groups query).
 *
 * Changes made outside the extension are recorded as entries of their own the
 * next time we save over one, so they mostly just pass through here. What is
 * never recorded is the one nobody has saved over yet: if a group's newest
 * entry does not account for the modifiedOn it carries right now, somebody
 * has touched it since, and that gets a marker.
 *
 * The result is ordered newest-first by when things actually happened, so an
 * external change sorts among the saves of every other group rather than only
 * within its own.
 */
export const buildTimeline = (
  entries: HistoryEntry[],
  currentModifiedOn: Record<number, string | undefined>,
): TimelineItem[] => {
  const timeline: TimelineItem[] = [];
  const groupsSeen = new Set<number>();

  for (const entry of entries) {
    if (!groupsSeen.has(entry.groupId)) {
      groupsSeen.add(entry.groupId);

      const current = currentModifiedOn[entry.groupId];
      if (current && !sameInstant(entryModifiedOn(entry), current)) {
        timeline.push({
          kind: 'external',
          groupId: entry.groupId,
          groupName: entry.groupName,
          detectedAt: current,
        });
      }
    }

    timeline.push(
      entry.kind === 'save'
        ? { kind: 'entry', entry }
        : {
            kind: 'external',
            groupId: entry.groupId,
            groupName: entry.groupName,
            detectedAt: entry.modifiedOn,
            actor: entry.actor,
          },
    );
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
