import type { QueryClient } from '@tanstack/react-query';
import * as SDK from 'azure-devops-extension-sdk';
import { getChangeStatus } from '@/features/library-changes';
import type { SaveOutcome } from '@/features/save-changes/saveLibraryChanges';
import { appendHistoryEntries } from './api/historyStorage';
import { historyQueryKey } from './hooks/useHistory';
import type { HistoryEntry } from './models';

/** Pure: outcome -> entries (successful groups only). Exported for tests. */
export const buildHistoryEntries = (
  outcome: SaveOutcome,
  actor: { id: string; displayName: string },
  timestamp: string,
  makeId: () => string,
): HistoryEntry[] =>
  outcome.results
    .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
    .map((r) => ({
      id: makeId(),
      timestamp,
      actor,
      groupId: r.groupId,
      groupName: r.groupName,
      modifiedOnBefore: r.modifiedOnBefore
        ? new Date(r.modifiedOnBefore).toISOString()
        : undefined,
      modifiedOnAfter: r.updated.modifiedOn
        ? new Date(r.updated.modifiedOn).toISOString()
        : undefined,
      changes: r.changes.map((c) => {
        const status = getChangeStatus(c);
        return {
          key: status === 'renamed' ? (c.previousKey ?? c.key) : c.key,
          status,
          renamedTo: status === 'renamed' ? c.key : undefined,
        };
      }),
    }));

/** Fire-and-forget: builds entries and appends them; also invalidates the history query. */
export const recordSaveHistory = async (
  outcome: SaveOutcome,
  queryClient: QueryClient,
): Promise<void> => {
  const user = SDK.getUser();
  const entries = buildHistoryEntries(
    outcome,
    { id: user.id, displayName: user.displayName },
    new Date().toISOString(),
    () => crypto.randomUUID(),
  );
  if (!entries.length) {
    return;
  }
  try {
    await appendHistoryEntries(entries);
    queryClient.invalidateQueries({ queryKey: historyQueryKey });
  } catch (e) {
    // History is best-effort; a storage failure must never break the save flow.
    console.error('Failed to record library history', e);
  }
};
