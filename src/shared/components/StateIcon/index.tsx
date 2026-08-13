import { Icon } from 'azure-devops-ui/Icon';
import { Tooltip } from 'azure-devops-ui/TooltipEx';
import { memo } from 'react';

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

export type State =
  | { type: 'New' | 'Modified' | 'Deleted' | 'Unchanged' }
  | ErrorState;

export type ErrorState = { type: 'Error'; message: string };

const textColors: Record<State['type'], string> = {
  New: 'var(--status-success-foreground)',
  Modified: 'var(--status-warning-foreground)',
  Deleted: 'var(--status-error-foreground)',
  Unchanged: '',
  Error: 'var(--status-error-foreground)',
};

export const StateIcon = memo(
  ({
    state,
    circle,
    hideError,
  }: {
    state: State;
    circle?: boolean;
    /** For cells that already surface the error inline (TextFieldCell renders
     * it as a prefix icon); the state slot stays empty so the error tooltip
     * is not lost to the action button that replaces this slot on hover. */
    hideError?: boolean;
  }) => {
    if (state.type === 'Unchanged' || (hideError && state.type === 'Error')) {
      return <span />;
    }

    return (
      <Tooltip text={state.type === 'Error' ? state.message : state.type}>
        <span
          className="state-icon padding-vertical-8 padding-horizontal-8 margin-horizontal-4"
          style={{ color: textColors[state.type] }}
        >
          {(state.type === 'Error' && <Icon iconName="Error" />) ||
            (circle && (
              <Icon iconName="fluent-CircleFilled" style={{ fontSize: 9 }} />
            )) ||
            state.type.charAt(0)}
        </span>
      </Tooltip>
    );
  },
);
