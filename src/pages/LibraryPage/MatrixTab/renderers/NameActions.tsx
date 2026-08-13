import { Button } from 'azure-devops-ui/Button';
import { Observer } from 'azure-devops-ui/Observer';
import type { ObservableMatrixVariable } from '@/features/variable-groups/models';
import { StateIcon } from '@/shared/components/StateIcon';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';

export const NameActions = ({ data }: { data: ObservableMatrixVariable }) => {
  const { hasMouse, hasFocus } = useTreeRow();

  return (
    <Observer
      state={data.name.state}
      isSecret={data.name.isSecret}
      hasMouseOrFocus={hasMouse || hasFocus}
    >
      {({ state, isSecret, hasMouseOrFocus }) => {
        if (!hasMouseOrFocus || state.type === 'Deleted') {
          return <StateIcon state={state} hideError />;
        }

        return (
          <Button
            subtle
            iconProps={{ iconName: isSecret ? 'Lock' : 'Unlock' }}
            onMouseDown={(e) => e.preventDefault()}
            tooltipProps={{
              text: isSecret
                ? 'Change variable type to plain text'
                : 'Change variable type to secret',
            }}
            onClick={() => {
              data.name.isSecret.value = !isSecret;
            }}
          />
        );
      }}
    </Observer>
  );
};
