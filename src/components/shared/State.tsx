import { CircleFilled } from '@fluentui/react-icons';
import { Icon } from 'azure-devops-ui/Icon';
import { Tooltip } from 'azure-devops-ui/TooltipEx';
import { memo } from 'react';

export type State =
  | { type: 'New' | 'Modified' | 'Deleted' | 'Unchanged' }
  | ErrorState;

export type ErrorState = { type: 'Error'; message: string };

export const States: Record<Exclude<State['type'], 'Error'>, State> & {
  error: (message: string) => ErrorState;
} = {
  New: { type: 'New' },
  Modified: { type: 'Modified' },
  Deleted: { type: 'Deleted' },
  Unchanged: { type: 'Unchanged' },
  error: (message: string): ErrorState => ({ type: 'Error', message }),
};

export const statesEqual = (a: State, b: State) =>
  a.type === b.type &&
  (a.type !== 'Error' || a.message === (b as ErrorState).message);

const textColors: Record<State['type'], string> = {
  New: 'var(--status-success-foreground)',
  Modified: 'var(--status-warning-foreground)',
  Deleted: 'var(--status-error-foreground)',
  Unchanged: '',
  Error: 'var(--status-error-foreground)',
};

export const StateIcon = memo(
  ({ state, circle }: { state: State; circle?: boolean }) =>
    (state.type === 'Unchanged' && <span />) ||
    (state.type === 'Error' && (
      <Icon
        iconName="Error"
        style={{ color: textColors[state.type] }}
        tooltipProps={{ text: state.message }}
      />
    )) || (
      <Tooltip text={state.type}>
        <span
          className="text-field-status padding-vertical-8 padding-horizontal-8 margin-horizontal-4"
          style={{ color: textColors[state.type] }}
        >
          {(circle && <CircleFilled fontSize={9} />) || state.type.charAt(0)}
        </span>
      </Tooltip>
    ),
);
