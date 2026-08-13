import { Observer } from 'azure-devops-ui/Observer';
import type { ObservableMatrixVariable } from '@/features/variable-groups/models';
import { SecretToggleButton } from '@/shared/components/SecretVariableType';
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
          <SecretToggleButton
            isSecret={isSecret}
            onToggle={() => {
              data.name.isSecret.value = !isSecret;
            }}
          />
        );
      }}
    </Observer>
  );
};
