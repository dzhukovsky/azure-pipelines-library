import { describe, expect, test } from 'bun:test';
import {
  ObservableVariable,
  ObservableVariableGroup,
} from '@/features/variable-groups/models';
import { HomeTabModel } from '@/pages/LibraryPage/HomeTab/HomeTabModel';
import { getChangeStatus } from './types';
import { mapHomeChanges } from './fromHomeModel';

const makeModel = () => {
  const group = new ObservableVariableGroup(
    1,
    'group',
    [
      new ObservableVariable('plain', '1', false, false),
      new ObservableVariable('secret', undefined as unknown as string, true, false),
      new ObservableVariable('gone', 'x', false, false),
    ],
    false,
    undefined,
    new Date('2026-01-01T00:00:00Z'),
  );
  return { model: new HomeTabModel([group], []), group };
};

describe('mapHomeChanges', () => {
  test('collects rename, deletion, addition and secret preservation', () => {
    const { model, group } = makeModel();
    const [plain, secret, gone] = group.variables.value;

    plain.name.value = 'renamed';           // rename, value untouched
    secret.isSecret.value = false;          // secret -> plain, value untouched
    gone.delete();                          // deletion
    const added = group.addVariable();      // addition
    added.name.value = 'fresh';
    added.value.value = 'v';

    const changes = mapHomeChanges(model);
    expect(changes.groups).toHaveLength(1);
    const g = changes.groups[0];
    expect(g.groupId).toBe(1);
    expect(g.modifiedOnSnapshot).toEqual(new Date('2026-01-01T00:00:00Z'));

    const byKey = Object.fromEntries(g.variables.map((v) => [v.key, v]));
    expect(getChangeStatus(byKey.renamed)).toBe('renamed');
    expect(byKey.renamed.previousKey).toBe('plain');
    expect(byKey.renamed.valueChanged).toBe(false);
    expect(byKey.renamed.value).toBeUndefined();

    expect(byKey.secret.isSecretChanged).toBe(true);
    expect(byKey.secret.valueChanged).toBe(false);

    expect(getChangeStatus(byKey.gone)).toBe('deleted');
    expect(getChangeStatus(byKey.fresh)).toBe('added');
    expect(byKey.fresh.value).toBe('v');
  });

  test('unchanged model produces no changes', () => {
    const { model } = makeModel();
    expect(mapHomeChanges(model).groups).toHaveLength(0);
    expect(mapHomeChanges(model).files).toHaveLength(0);
  });
});
