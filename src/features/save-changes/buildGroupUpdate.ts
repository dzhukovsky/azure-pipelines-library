import type {
  VariableGroup,
  VariableGroupParameters,
} from 'azure-devops-extension-api/TaskAgent';
import type { GroupChange } from '@/features/library-changes';

export class GroupConflictError extends Error {
  readonly groupId: number;
  readonly groupName: string;

  constructor(groupId: number, groupName: string) {
    super(
      `Variable group "${groupName}" was modified by someone else since it was loaded.`,
    );
    this.name = 'GroupConflictError';
    this.groupId = groupId;
    this.groupName = groupName;
  }
}

/** Throws GroupConflictError when the server copy changed since the model snapshot. */
export function buildVariableGroupParameters(
  current: VariableGroup, // freshly fetched, full (incl. variableGroupProjectReferences)
  change: GroupChange,
): VariableGroupParameters {
  if (
    change.modifiedOnSnapshot &&
    current.modifiedOn &&
    new Date(change.modifiedOnSnapshot).getTime() !==
      new Date(current.modifiedOn).getTime()
  ) {
    throw new GroupConflictError(change.groupId, change.name);
  }

  const variables = { ...current.variables };

  for (const c of change.variables) {
    if (c.state.type === 'Deleted') {
      delete variables[c.previousKey ?? c.key];
      continue;
    }

    if (c.previousKey && c.previousKey !== c.key) {
      delete variables[c.previousKey];
    }

    const existing = current.variables[c.previousKey ?? c.key];
    variables[c.key] = {
      value: c.valueChanged ? (c.value ?? '') : existing?.value,
      isSecret: c.isSecret,
      isReadOnly: existing?.isReadOnly ?? false,
    };
  }

  return {
    name: change.nameChanged ? change.name : current.name,
    description: current.description,
    type: current.type,
    providerData: current.providerData,
    // A project-scoped group is named by its project reference, so a rename
    // that only changes the name above is accepted and then ignored.
    variableGroupProjectReferences: change.nameChanged
      ? current.variableGroupProjectReferences?.map((reference) => ({
          ...reference,
          name: change.name,
        }))
      : current.variableGroupProjectReferences,
    variables,
  };
}
