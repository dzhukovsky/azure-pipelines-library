import { Observer } from 'azure-devops-ui/Observer';
import type { ObservableVariable } from '@/features/variable-groups/models';
import { SecretToggleButton } from '@/shared/components/SecretVariableType';
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
          <SecretToggleButton
            isSecret={isSecret}
            onToggle={() => {
              data.isSecret.value = !isSecret;
            }}
          />
        )
      }
    </Observer>
  );
};
