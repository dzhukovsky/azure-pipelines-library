import { Button } from 'azure-devops-ui/Button';
import { Observer } from 'azure-devops-ui/Observer';
import type {
  ITreeItemEx,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { ObservableVariable } from '@/features/variable-groups/models';
import { StateIcon, States } from '@/shared/components/StateIcon';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';
import type { HomeTreeItem } from '../../HomeTree';

export const ValueActions = ({
  data,
  treeItem,
}: {
  data: ObservableVariable;
  treeItem: ITreeItemEx<HomeTreeItem>;
  itemProvider: ITreeItemProvider<HomeTreeItem>;
}) => {
  const { hasMouse, hasFocus, onBlur } = useTreeRow();
  const hasMouseOrFocus = hasMouse || hasFocus;

  return (
    <Observer state={data.state}>
      {({ state }) => {
        if (!hasMouseOrFocus) {
          return <StateIcon state={state} />;
        }

        if (state === States.Deleted) {
          return (
            <Button
              subtle
              iconProps={{ iconName: 'Undo' }}
              tooltipProps={{ text: `Restore variable '${data.name.value}'` }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                data.restore();
                onBlur?.();
              }}
            />
          );
        }

        return (
          <Button
            subtle
            iconProps={{ iconName: 'Delete' }}
            tooltipProps={{ text: `Delete variable '${data.name.value}'` }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const group = treeItem.parentItem?.underlyingItem.data;
              if (group?.type !== 'group') {
                return;
              }

              if (data.isNew) {
                group.data.removeNewVariable(data); // row disappears via reactive items (Task 4)
              } else {
                data.delete();
              }
              onBlur?.();
            }}
          />
        );
      }}
    </Observer>
  );
};
