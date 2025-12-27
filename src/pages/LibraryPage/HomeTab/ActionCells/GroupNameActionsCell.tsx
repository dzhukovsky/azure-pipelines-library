import { Button } from 'azure-devops-ui/Button';
import type {
  ITreeItemEx,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import {
  ObservableVariable,
  type ObservableVariableGroup,
} from '@/features/variable-groups/models';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';
import type { HomeTreeItem } from '../VariablesTree';

export const GroupNameActionsCell = ({
  data,
  treeItem,
  rowIndex,
  itemProvider,
}: {
  data: ObservableVariableGroup;
  treeItem: ITreeItemEx<HomeTreeItem>;
  rowIndex: number;
  itemProvider: ITreeItemProvider<HomeTreeItem>;
}) => {
  const { hasMouse, hasFocus } = useTreeRow();
  const hasMouseOrFocus = hasMouse || hasFocus;

  if (!hasMouseOrFocus) {
    return <span />;
  }

  return (
    <Button
      subtle
      iconProps={{ iconName: 'Add' }}
      tooltipProps={{ text: 'Add new variable' }}
      onClick={(e) => {
        const variable = new ObservableVariable('', '', false, true);
        data.variables.push(variable);

        itemProvider.add(
          {
            data: {
              type: 'groupVariable',
              data: variable,
            },
            highlighted: true,
          },
          treeItem.underlyingItem,
        );

        if (!treeItem.underlyingItem.expanded) {
          itemProvider.toggle(treeItem.underlyingItem);
        }

        window.requestAnimationFrame(() => selectNextRowInput(rowIndex));
        e.stopPropagation();
      }}
    />
  );
};

function selectNextRowInput(rowIndex: number) {
  const currentRow = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
  if (!currentRow) return;

  const nextRow = currentRow.nextElementSibling;
  if (!nextRow || nextRow.tagName.toLowerCase() !== 'tr') {
    return;
  }

  const input = nextRow.querySelector('input');
  if (!input) return;

  input.select?.();
}
