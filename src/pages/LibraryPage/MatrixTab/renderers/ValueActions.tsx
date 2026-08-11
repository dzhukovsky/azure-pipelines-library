import { Button } from 'azure-devops-ui/Button';
import { Observer } from 'azure-devops-ui/Observer';
import { useCallback } from 'react';
import type {
  GroupId,
  ObservableMatrixValue,
  ObservableMatrixVariable,
} from '@/features/variable-groups/models';
import { StateIcon, States } from '@/shared/components/StateIcon';
import { useTreeCell } from '@/shared/components/Tree/useTreeCell';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';

export const ValueActions = ({
  data,
  variable,
  groupId,
}: {
  data: ObservableMatrixValue;
  variable: ObservableMatrixVariable;
  groupId: GroupId;
}) => {
  const { onBlur: onRowBlur } = useTreeRow();
  const { hasMouse, hasFocus, onBlur: onCellBlur } = useTreeCell();

  const onBlur = useCallback(() => {
    onCellBlur?.();
    onRowBlur?.();
  }, [onCellBlur, onRowBlur]);

  return (
    <Observer
      state={data.state}
      isNew={data.isNew}
      hasMouseOrFocus={hasMouse || hasFocus}
    >
      {({ state, isNew, hasMouseOrFocus }) => {
        if (!hasMouseOrFocus) {
          return <StateIcon state={state} />;
        }

        if (state === States.Deleted) {
          return (
            <Button
              subtle
              iconProps={{ iconName: 'Undo' }}
              tooltipProps={{ text: 'Restore value' }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                variable.restoreVariable(groupId);
                onBlur?.();
              }}
            />
          );
        }

        if (state === States.Unchanged && isNew) {
          return (
            <Button
              subtle
              iconProps={{ iconName: 'Add' }}
              tooltipProps={{ text: 'Add new variable' }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                variable.addValue(groupId);
                const element = e.currentTarget;
                window.requestAnimationFrame(() => selectClosestInput(element));
                e.stopPropagation();
              }}
            />
          );
        }

        return (
          <Button
            subtle
            iconProps={{ iconName: 'Delete' }}
            tooltipProps={{ text: 'Delete value' }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              variable.deleteVariable(groupId);
              onBlur?.();
            }}
          />
        );
      }}
    </Observer>
  );
};

function selectClosestInput(element: HTMLElement) {
  const input = element.parentElement?.querySelector('input');
  input?.select();
}
