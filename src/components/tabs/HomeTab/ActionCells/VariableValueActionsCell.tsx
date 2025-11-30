import { Button } from 'azure-devops-ui/Button';
import { Observer } from 'azure-devops-ui/Observer';
import { StateIcon } from '@/components/shared/State';
import { useTreeRow } from '@/components/shared/Tree/useTreeRow';
import type { ObservableVariable } from '@/models/VariableGroup';

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
