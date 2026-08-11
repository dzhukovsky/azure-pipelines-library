import { Button } from 'azure-devops-ui/Button';
import { Observer } from 'azure-devops-ui/Observer';
import type { ObservableVariable } from '@/features/variable-groups/models';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';

export const NameActions = ({ data }: { data: ObservableVariable }) => {
  const { hasMouse, hasFocus } = useTreeRow();
  const hasMouseOrFocus = hasMouse || hasFocus;

  if (!hasMouseOrFocus) {
    return <span />;
  }

  return (
    <Observer isSecret={data.isSecret} state={data.state}>
      {({ isSecret, state }) =>
        state.type === 'Deleted' ? (
          <span />
        ) : (
          <Button
            subtle
            iconProps={{ iconName: isSecret ? 'Lock' : 'Unlock' }}
            tooltipProps={{
              text: isSecret
                ? 'Change variable type to plain text'
                : 'Change variable type to secret',
            }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              data.isSecret.value = !isSecret;
            }}
          />
        )
      }
    </Observer>
  );
};
