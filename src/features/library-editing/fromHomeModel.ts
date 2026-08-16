import type {
  ObservableVariable,
  ObservableVariableGroup,
} from '@/features/variable-groups/models';
import { getArrayChanges } from '@/shared/lib/observable';
import type { HomeTabModel } from './HomeTabModel';
import type { GroupChange, LibraryChanges, VariableChange } from './types';

const mapVariable = (v: ObservableVariable): VariableChange => ({
  key: v.name.value,
  previousKey: !v.isNew && v.name.modified ? v.name.initialValue : undefined,
  value: v.value.modified || v.isNew ? v.value.value : undefined,
  valueChanged: v.value.modified || v.isNew,
  isSecret: v.isSecret.value,
  isSecretChanged: v.isSecret.modified,
  state: v.state.value,
});

const mapGroup = (g: ObservableVariableGroup): GroupChange => ({
  groupId: g.id,
  name: g.name.value,
  nameChanged: g.name.modified,
  previousName: g.name.modified ? g.name.initialValue : undefined,
  modifiedOnSnapshot: g.modifiedOn,
  state: g.state.value,
  variables: getArrayChanges(g.variables)
    .map(mapVariable)
    .sort((a, b) => a.key.localeCompare(b.key)),
});

export const mapHomeChanges = (model: HomeTabModel): LibraryChanges => ({
  groups: getArrayChanges(model.variableGroups)
    .map(mapGroup)
    .sort((a, b) => a.name.localeCompare(b.name)),
  files: getArrayChanges(model.secureFiles)
    .map((sf) => ({
      fileId: sf.id,
      name: sf.name.value,
      state: sf.state.value,
      properties: getArrayChanges(sf.properties)
        .map((p) => ({
          name: p.name.value,
          value: p.value.value,
          state: p.state.value,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
});
