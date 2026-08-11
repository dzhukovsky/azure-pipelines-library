import { Button } from 'azure-devops-ui/Button';
import type {
  ITreeItemEx,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';
import type { HomeTreeItem } from '../../HomeTree';

export const NameActions = (props: {
  data: ObservableVariableGroup;
  treeItem: ITreeItemEx<HomeTreeItem>;
  rowIndex: number;
  itemProvider: ITreeItemProvider<HomeTreeItem>;
}) => {
  const { data, rowIndex } = props;
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
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        data.addVariable();
        window.requestAnimationFrame(() => selectLastAddedInput(rowIndex));
        e.stopPropagation();
      }}
    />
  );
};

// The new row is appended as the group's last child by the reactive rebuild.
// Walk forward from the group row through its sibling rows (until the next
// root row) and focus the last empty name input found — that's the new row.
function selectLastAddedInput(groupRow: number) {
  const currentRow = document.querySelector(`tr[data-row-index="${groupRow}"]`);
  let next = currentRow?.nextElementSibling ?? null;
  let target: HTMLInputElement | null = null;

  while (next && next.tagName.toLowerCase() === 'tr') {
    const input = next.querySelector('input');
    if (input && input.value === '') {
      target = input;
    }
    next = next.nextElementSibling;
  }

  target?.select();
}
