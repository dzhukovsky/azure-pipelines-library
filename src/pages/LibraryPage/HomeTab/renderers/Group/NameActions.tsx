import { Button } from 'azure-devops-ui/Button';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import { selectTreeRowInput } from '@/shared/components/Tree/selectTreeRowInput';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';

export const NameActions = (props: {
  data: ObservableVariableGroup;
  rowIndex: number;
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
        // The reactive rebuild inserts the new row as the group's first
        // child, so it renders directly under the group row.
        window.requestAnimationFrame(() =>
          selectTreeRowInput(document.body, rowIndex + 1),
        );
        e.stopPropagation();
      }}
    />
  );
};
