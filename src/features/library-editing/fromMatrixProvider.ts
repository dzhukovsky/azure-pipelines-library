import { States } from '@/shared/components/StateIcon';
import type { MatrixDataProvider } from './MatrixDataProvider';
import type { GroupChange, LibraryChanges, VariableChange } from './types';

export const mapMatrixChanges = (
  provider: MatrixDataProvider,
): LibraryChanges => {
  const groups = new Map<number, GroupChange>();

  const groupChange = (groupId: number): GroupChange => {
    let change = groups.get(groupId);
    if (!change) {
      const ref = provider.groups.find((g) => g.id === groupId);
      change = {
        groupId,
        name: ref?.name ?? String(groupId),
        nameChanged: false,
        modifiedOnSnapshot: ref?.modifiedOn,
        state: States.Modified,
        variables: [],
      };
      groups.set(groupId, change);
    }
    return change;
  };

  for (const row of provider.variables.value) {
    const name = row.name.name.value;
    const previousKey =
      !row.name.isNew && row.name.name.modified
        ? row.name.name.initialValue
        : undefined;
    const renamed = previousKey !== undefined && previousKey !== name;
    const secretFlag = row.name.isSecret;
    const nameError = row.name.error.value;

    for (const groupId of provider.groupIds) {
      const cell = row.values[groupId];
      if (!cell) {
        continue;
      }
      const cellState = cell.state.value;
      const isSecret = secretFlag.value ?? cell.isSecretInitial;
      const isSecretChanged = secretFlag.modified && secretFlag.value !== null;

      const cellChanged =
        cellState.type !== 'Unchanged' || // Deleted / New / Modified / Error
        (cell.present.value && (renamed || isSecretChanged));

      if (!cellChanged) {
        continue;
      }

      const change: VariableChange = {
        key: name,
        previousKey: renamed ? previousKey : undefined,
        value:
          cell.value.modified || cellState.type === 'New'
            ? cell.value.value
            : undefined,
        valueChanged: cell.value.modified || cellState.type === 'New',
        isSecret,
        isSecretChanged,
        state: nameError
          ? States.error(nameError)
          : cellState.type === 'Unchanged'
            ? States.Modified
            : cellState,
      };
      groupChange(groupId).variables.push(change);
    }
  }

  return {
    groups: [...groups.values()]
      .map((g) => ({
        ...g,
        variables: g.variables.sort((a, b) => a.key.localeCompare(b.key)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    files: [],
  };
};
