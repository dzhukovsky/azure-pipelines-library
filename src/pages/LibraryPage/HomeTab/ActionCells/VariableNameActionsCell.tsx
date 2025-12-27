import { Button } from 'azure-devops-ui/Button';
import type {
  ITreeItemEx,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { ObservableVariable } from '@/features/variable-groups/models';
import { States } from '@/shared/components/StateIcon';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';
import type { HomeTreeItem } from '../VariablesTree';

export const VariableNameActionsCell = ({
  data,
  treeItem,
  itemProvider,
}: {
  data: ObservableVariable;
  treeItem: ITreeItemEx<HomeTreeItem>;
  itemProvider: ITreeItemProvider<HomeTreeItem>;
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
          const group = treeItem.parentItem?.underlyingItem.data;
          if (group?.type !== 'group') {
            return;
          }

          group.data.variables.push(data);

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
          const group = treeItem.parentItem?.underlyingItem.data;
          if (group?.type !== 'group') {
            return;
          }

          if (data.state.initialValue === States.New) {
            itemProvider.remove(
              treeItem.underlyingItem,
              treeItem.parentItem?.underlyingItem,
            );
          }

          group.data.variables.removeAll((x) => x === data);

          data.state.value = States.Deleted;
          onBlur?.();
        }}
      />
    )
  );
};
