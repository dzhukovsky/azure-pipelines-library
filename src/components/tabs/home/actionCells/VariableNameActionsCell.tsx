import { Button } from 'azure-devops-ui/Button';
import type {
  ITreeItemEx,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { States } from '@/components/shared/State';
import { useTreeRow } from '@/components/shared/Tree/useTreeRow';
import {
  type ObservableVariable,
  ObservableVariableGroup,
} from '@/models/VariableGroup';
import type { LibraryItem } from '../VariablesTree';

export const VariableNameActionsCell = ({
  data,
  treeItem,
  itemProvider,
}: {
  data: ObservableVariable;
  treeItem: ITreeItemEx<LibraryItem>;
  itemProvider: ITreeItemProvider<LibraryItem>;
}) => {
  const { hasMouse, hasFocus, onBlur } = useTreeRow();
  const hasMouseOrFocus = hasMouse || hasFocus;

  if (!hasMouseOrFocus) {
    return <span />;
  }

  const deleted = data.state.value.type === 'Deleted';

  return (
    (deleted && (
      <Button
        subtle
        iconProps={{ iconName: 'Undo' }}
        tooltipProps={{
          text: `Restore variable '${data.name.value}'`,
        }}
        onClick={() => {
          data.state.value = data.modified ? States.Modified : States.Unchanged;
          onBlur?.();
        }}
      />
    )) || (
      <Button
        subtle
        iconProps={{ iconName: 'Delete' }}
        tooltipProps={{
          text: `Delete variable '${data.name.value}'`,
        }}
        onClick={() => {
          if (data.state.initialValue !== States.New) {
            data.state.value = States.Deleted;
            onBlur?.();
            return;
          }

          const group = treeItem.parentItem?.underlyingItem.data.group;
          if (!group) {
            return;
          }

          group.variables.removeAll((x) => x === data);

          itemProvider.remove(
            treeItem.underlyingItem,
            treeItem.parentItem?.underlyingItem,
          );
        }}
      />
    )
  );
};
