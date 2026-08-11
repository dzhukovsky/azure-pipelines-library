import type { HomeTabModel } from '@/pages/LibraryPage/HomeTab/HomeTabModel';
import type { MatrixDataProvider } from '@/pages/LibraryPage/MatrixTab/MatrixDataProvider';
import type { LibraryChanges } from './types';

const normalize = (name: string) => name.trim().toLocaleLowerCase();

export const validateHomeModel = (model: HomeTabModel): boolean => {
  let valid = true;

  for (const group of model.variableGroups.value) {
    const variables = group.variables.value;
    variables.forEach((v) => {
      v.error.value = undefined;
    });

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
  const rows = provider.variables.value;

  rows.forEach((row) => {
    row.name.error.value = undefined;
    Object.values(row.values).forEach((cell) => {
      cell.error.value = undefined;
    });
  });

  const counts = new Map<string, number>();
  const isActive = (row: (typeof rows)[number]) =>
    row.modified || Object.values(row.values).some((c) => c.present.value);

  for (const row of rows.filter(isActive)) {
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

    const flippedToPlain =
      row.name.isSecret.initialValue === true &&
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
  }

  return valid;
};

export const hasErrors = (changes: LibraryChanges): boolean =>
  changes.groups.some(
    (g) =>
      g.state.type === 'Error' ||
      g.variables.some((v) => v.state.type === 'Error'),
  );
