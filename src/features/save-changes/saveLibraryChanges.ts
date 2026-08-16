import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import type {
  LibraryChanges,
  VariableChange,
} from '@/features/library-editing';
import {
  getVariableGroupById,
  updateVariableGroupById,
} from '@/features/variable-groups/hooks/useVariableGroups';
import {
  buildVariableGroupParameters,
  GroupConflictError,
} from './buildGroupUpdate';

export type GroupSaveResult =
  | {
      groupId: number;
      groupName: string;
      ok: true;
      updated: VariableGroup;
      /** The group as we found it, which is what an external change looks like. */
      nameBefore?: string;
      modifiedOnBefore?: Date;
      modifiedByBefore?: { id: string; displayName: string };
      changes: VariableChange[];
    }
  | { groupId: number; groupName: string; ok: false; error: string };

export type SaveOutcome = { results: GroupSaveResult[]; ok: boolean };

/** The Azure DevOps calls the save flow depends on; injectable for testing. */
export type SaveLibraryClient = {
  getVariableGroupById: typeof getVariableGroupById;
  updateVariableGroupById: typeof updateVariableGroupById;
};

const defaultClient: SaveLibraryClient = {
  getVariableGroupById,
  updateVariableGroupById,
};

/** Sequentially saves every changed group; never throws — errors land in results. */
export const saveLibraryChanges = async (
  changes: LibraryChanges,
  client: SaveLibraryClient = defaultClient,
): Promise<SaveOutcome> => {
  const results: GroupSaveResult[] = [];

  for (const change of changes.groups) {
    try {
      // Fetch fresh: the list endpoint omits variableGroupProjectReferences,
      // and this is also the concurrency-check input.
      const current = await client.getVariableGroupById(change.groupId);
      const parameters = buildVariableGroupParameters(current, change);
      const updated = await client.updateVariableGroupById(
        change.groupId,
        parameters,
      );
      const modifiedByBefore = current.modifiedBy ?? current.createdBy;
      results.push({
        groupId: change.groupId,
        groupName: change.name,
        ok: true,
        updated,
        nameBefore: current.name,
        modifiedOnBefore: current.modifiedOn,
        modifiedByBefore: modifiedByBefore && {
          id: modifiedByBefore.id,
          displayName: modifiedByBefore.displayName,
        },
        changes: change.variables,
      });
    } catch (e) {
      const message =
        e instanceof GroupConflictError
          ? 'The group was modified outside this session. Discard your changes and retry.'
          : e instanceof Error
            ? e.message
            : String(e);
      results.push({
        groupId: change.groupId,
        groupName: change.name,
        ok: false,
        error: message,
      });
    }
  }

  return { results, ok: results.every((r) => r.ok) };
};
