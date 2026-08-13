import type { HomeTabModel } from '@/pages/LibraryPage/HomeTab/HomeTabModel';
import type { MatrixDataProvider } from '@/pages/LibraryPage/MatrixTab/MatrixDataProvider';
import type { LibraryChanges } from './types';

const normalize = (name: string) => name.trim().toLocaleLowerCase();

/** Clears every variable error on the model. Exported so callers can clear
 * stale errors (e.g. after the user reverts the edit that caused them)
 * without running a full validation pass. */
export const clearHomeModelErrors = (model: HomeTabModel): void => {
  for (const group of model.variableGroups.value) {
    group.error.value = undefined;
    group.variables.value.forEach((v) => {
      v.error.value = undefined;
    });
  }
};

/** Clears every row-name and cell error on the provider. See
 * clearHomeModelErrors for why this is exported separately from validation. */
export const clearMatrixProviderErrors = (
  provider: MatrixDataProvider,
): void => {
  provider.variables.value.forEach((row) => {
    row.name.error.value = undefined;
    Object.values(row.values).forEach((cell) => {
      cell.error.value = undefined;
    });
  });
};

export const validateHomeModel = (model: HomeTabModel): boolean => {
  let valid = true;
  clearHomeModelErrors(model);

  const groups = model.variableGroups.value.filter((g) => g.present.value);
  const groupCounts = new Map<string, number>();
  for (const group of groups) {
    const key = normalize(group.name.value);
    groupCounts.set(key, (groupCounts.get(key) ?? 0) + 1);
  }

  for (const group of groups) {
    if (!group.name.value.trim()) {
      group.error.value = 'Name is required';
    } else if ((groupCounts.get(normalize(group.name.value)) ?? 0) > 1) {
      group.error.value = 'Duplicate group name';
    }
    valid &&= !group.error.value;
  }

  // Only present groups: a group being deleted must not have its variables
  // block the save with stale name errors.
  for (const group of groups) {
    const variables = group.variables.value;

    const present = variables.filter((v) => v.present.value);

    const counts = new Map<string, number>();
    for (const v of present) {
      const key = normalize(v.name.value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    for (const v of present) {
      if (!v.name.value.trim()) {
        v.error.value = 'Name is required';
      } else if ((counts.get(normalize(v.name.value)) ?? 0) > 1) {
        v.error.value = 'Duplicate variable name';
      } else if (
        v.isSecret.initialValue === true &&
        v.isSecret.value === false &&
        !v.value.modified
      ) {
        v.error.value =
          'Re-enter the value when converting a secret to plain text';
      } else if (
        !v.isNew &&
        v.name.modified &&
        v.isSecret.value === true &&
        !v.value.modified
      ) {
        v.error.value = 'Re-enter the value when renaming a secret variable';
      }
      valid &&= !v.error.value;
    }
  }

  return valid;
};

export const validateMatrixProvider = (
  provider: MatrixDataProvider,
): boolean => {
  let valid = true;
  clearMatrixProviderErrors(provider);
  const rows = provider.variables.value;

  const hasPresentCell = (row: (typeof rows)[number]) =>
    Object.values(row.values).some((c) => c.present.value);
  const isActive = (row: (typeof rows)[number]) =>
    row.modified || hasPresentCell(row);

  // Duplicate counting only considers rows with at least one present cell —
  // a row that is `modified` solely because every cell was deleted must not
  // block re-adding the same name elsewhere.
  const counts = new Map<string, number>();
  for (const row of rows.filter(hasPresentCell)) {
    const key = normalize(row.name.name.value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  for (const row of rows.filter(isActive)) {
    const name = row.name.name.value;
    if (row.modified && !name.trim()) {
      row.name.error.value = 'Name is required';
    } else if ((counts.get(normalize(name)) ?? 0) > 1) {
      row.name.error.value = 'Duplicate variable name';
    }
    valid &&= !row.name.error.value;

    // A mixed-secret row (`initialValue === null`) also converts any of its
    // originally-secret cells to plain when flipped to `false`.
    const flippedToPlain =
      (row.name.isSecret.initialValue === true ||
        row.name.isSecret.initialValue === null) &&
      row.name.isSecret.value === false;
    if (flippedToPlain) {
      for (const cell of Object.values(row.values)) {
        if (
          cell.present.value &&
          cell.isSecretInitial &&
          !cell.value.modified
        ) {
          cell.error.value =
            'Re-enter the value when converting a secret to plain text';
          valid = false;
        }
      }
    }

    // A rename discards the server-stored secret value for every present
    // secret cell (the server keys secrets by name), so require re-entry.
    const renamed = !row.name.isNew && row.name.name.modified;
    if (renamed) {
      for (const cell of Object.values(row.values)) {
        const effectiveSecret = row.name.isSecret.value ?? cell.isSecretInitial;
        if (
          cell.present.value &&
          effectiveSecret === true &&
          !cell.value.modified &&
          !cell.error.value
        ) {
          cell.error.value =
            'Re-enter the value when renaming a secret variable';
          valid = false;
        }
      }
    }
  }

  return valid;
};

export const hasErrors = (changes: LibraryChanges): boolean =>
  changes.groups.some(
    (g) =>
      g.state.type === 'Error' ||
      g.variables.some((v) => v.state.type === 'Error'),
  );
