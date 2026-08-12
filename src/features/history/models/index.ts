import type { HistoryChangeStatus } from '@/features/library-changes';

export type HistoryEntryChange = {
  key: string; // for renames: the old key
  status: HistoryChangeStatus; // 'added' | 'modified' | 'deleted' | 'renamed'
  renamedTo?: string;
};

export type HistoryEntry = {
  id: string; // crypto.randomUUID()
  timestamp: string; // ISO, when the save happened
  actor: { id: string; displayName: string };
  groupId: number;
  groupName: string;
  modifiedOnBefore?: string; // ISO of group.modifiedOn before our save
  modifiedOnAfter?: string; // ISO of group.modifiedOn from the update response
  changes: HistoryEntryChange[];
};

// A save recorded by us, or a marker for changes made outside the extension.
export type TimelineItem =
  | { kind: 'entry'; entry: HistoryEntry }
  | {
      kind: 'external';
      groupId: number;
      groupName: string;
      /** modifiedOn observed now or from the next entry — best-known date of the external change */
      detectedAt?: string;
    };
