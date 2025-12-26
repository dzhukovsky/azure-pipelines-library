import { Button } from 'azure-devops-ui/Button';
import type {
  ITreeItemEx,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { ObservableVariable } from '@/features/variable-groups/models';
import { States } from '@/shared/components/State';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';
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
          const group = treeItem.parentItem?.underlyingItem.data.group;
          if (!group) {
            return;
          }

          group.variables.push(data);

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
          const group = treeItem.parentItem?.underlyingItem.data.group;
          if (!group) {
            return;
          }

          if (data.state.initialValue === States.New) {
            itemProvider.remove(
              treeItem.underlyingItem,
              treeItem.parentItem?.underlyingItem,
            );
          }

          group.variables.removeAll((x) => x === data);

          data.state.value = States.Deleted;
          onBlur?.();
        }}
      />
    )
  );
};
