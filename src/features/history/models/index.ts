import type { HistoryChangeStatus } from '@/features/library-editing';

export type HistoryActor = { id: string; displayName: string };

export type HistoryEntryChange = {
  key: string; // for renames: the old key
  status: HistoryChangeStatus; // 'added' | 'modified' | 'deleted' | 'renamed'
  renamedTo?: string;
};

/** A save this extension made. */
export type HistorySaveEntry = {
  kind: 'save';
  id: string; // crypto.randomUUID()
  timestamp: string; // ISO, when the save happened
  actor: HistoryActor;
  groupId: number;
  groupName: string;
  renamedFrom?: string; // set when the save renamed the group itself
  modifiedOnBefore?: string; // ISO of group.modifiedOn before our save
  modifiedOnAfter?: string; // ISO of group.modifiedOn from the update response
  changes: HistoryEntryChange[];
};

/**
 * A change somebody made outside the extension, recorded the moment we ran
 * into it — we know when it happened and who last touched the group, never
 * what changed.
 */
export type HistoryExternalEntry = {
  kind: 'external';
  id: string;
  timestamp: string; // ISO, same as modifiedOn — that is when it happened
  actor?: HistoryActor; // the group's modifiedBy when we noticed
  groupId: number;
  groupName: string;
  modifiedOn: string; // ISO of the group's modifiedOn we found
};

export type HistoryEntry = HistorySaveEntry | HistoryExternalEntry;

/** The modifiedOn a group carried once this entry was written. */
export const entryModifiedOn = (entry: HistoryEntry): string | undefined =>
  entry.kind === 'save' ? entry.modifiedOnAfter : entry.modifiedOn;

// A save, or a change made outside the extension. External items come either
// from a recorded entry or, for a change nobody has saved over yet, from
// comparing the newest entry against the group as it stands right now.
export type TimelineItem =
  | { kind: 'entry'; entry: HistorySaveEntry }
  | {
      kind: 'external';
      groupId: number;
      groupName: string;
      /** ISO of the group's modifiedOn when the change was spotted. */
      detectedAt?: string;
      /** Recorded with the entry; a live marker has none and the view falls back to the group. */
      actor?: HistoryActor;
    };
