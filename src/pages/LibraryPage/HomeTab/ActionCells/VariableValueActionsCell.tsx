import { Button } from 'azure-devops-ui/Button';
import { Observer } from 'azure-devops-ui/Observer';
import type { ObservableVariable } from '@/features/variable-groups/models';
import { StateIcon } from '@/shared/components/State';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';

export const VariableValueActionsCell = ({
  data,
}: {
  data: ObservableVariable;
}) => {
  const { hasMouse, hasFocus } = useTreeRow();
  const hasMouseOrFocus = hasMouse || hasFocus;

  if (!hasMouseOrFocus || data.state.value.type === 'Deleted') {
    return <StateIcon state={data.state.value} />;
  }

  return (
    <Observer isSecret={data.isSecret}>
      {({ isSecret }) => (
        <Button
          subtle
          iconProps={{ iconName: isSecret ? 'Lock' : 'Unlock' }}
          tooltipProps={{
            text: isSecret
              ? 'Change variable type to plain text'
              : 'Change variable type to secret',
          }}
          onClick={() => {
            data.isSecret.value = !isSecret;
          }}
        />
      )}
    </Observer>
  );
};
