import type { QueryClient } from '@tanstack/react-query';
import * as SDK from 'azure-devops-extension-sdk';
import { getChangeStatus } from '@/features/library-changes';
import type { SaveOutcome } from '@/features/save-changes/saveLibraryChanges';
import { appendHistoryEntries } from './api/historyStorage';
import { historyQueryKey } from './hooks/useHistory';
import {
  entryModifiedOn,
  type HistoryActor,
  type HistoryEntry,
} from './models';

const toIso = (date?: Date) =>
  date ? new Date(date).toISOString() : undefined;

/**
 * Pure: a save outcome and the history so far turn into the entries to record,
 * newest first. Successful groups only.
 *
 * A group whose recorded state does not account for the modifiedOn we found
 * just before saving was touched outside the extension in the meantime: that
 * is recorded as an entry of its own, so it survives the save that follows it
 * and keeps the person who actually made it.
 */
export const buildHistoryEntries = (
  outcome: SaveOutcome,
  actor: HistoryActor,
  timestamp: string,
  makeId: () => string,
  existing: HistoryEntry[] = [],
): HistoryEntry[] => {
  const lastKnownModifiedOn = new Map<number, string | undefined>();
  for (const entry of existing) {
    if (!lastKnownModifiedOn.has(entry.groupId)) {
      lastKnownModifiedOn.set(entry.groupId, entryModifiedOn(entry));
    }
  }

  return outcome.results
    .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
    .flatMap((r) => {
      const entries: HistoryEntry[] = [];
      const modifiedOnBefore = toIso(r.modifiedOnBefore);

      // Only a group we have written before can have drifted away from us;
      // for one we are saving for the first time there is nothing to compare.
      const lastKnown = lastKnownModifiedOn.get(r.groupId);
      if (lastKnown && modifiedOnBefore && lastKnown !== modifiedOnBefore) {
        entries.push({
          kind: 'external',
          id: makeId(),
          timestamp: modifiedOnBefore,
          actor: r.modifiedByBefore,
          groupId: r.groupId,
          groupName: r.nameBefore ?? r.groupName,
          modifiedOn: modifiedOnBefore,
        });
      }

      entries.push({
        kind: 'save',
        id: makeId(),
        timestamp,
        actor,
        groupId: r.groupId,
        groupName: r.groupName,
        renamedFrom:
          r.nameBefore && r.nameBefore !== r.groupName
            ? r.nameBefore
            : undefined,
        modifiedOnBefore,
        modifiedOnAfter: toIso(r.updated.modifiedOn),
        changes: r.changes.map((c) => {
          const status = getChangeStatus(c);
          return {
            // The server preserves entries by key: 'added' has no server-side
            // key yet, so use the new key; every other status (including a
            // rename that was immediately deleted) must record the key the
            // entry actually had on the server.
            key: status === 'added' ? c.key : (c.previousKey ?? c.key),
            status,
            renamedTo: status === 'renamed' ? c.key : undefined,
          };
        }),
      });

      // Newest first: the save happened after the change it found.
      return entries.reverse();
    });
};

/** Fire-and-forget: builds entries and appends them; also invalidates the history query. */
export const recordSaveHistory = async (
  outcome: SaveOutcome,
  queryClient: QueryClient,
): Promise<void> => {
  try {
    const user = SDK.getUser();
    const timestamp = new Date().toISOString();

    await appendHistoryEntries((existing) =>
      buildHistoryEntries(
        outcome,
        { id: user.id, displayName: user.displayName },
        timestamp,
        () => crypto.randomUUID(),
        existing,
      ),
    );

    queryClient.invalidateQueries({ queryKey: historyQueryKey });
  } catch (e) {
    // History is best-effort; a storage failure must never break the save flow.
    console.error('Failed to record library history', e);
  }
};
