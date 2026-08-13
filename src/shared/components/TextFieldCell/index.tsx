import './index.scss';

import type { IObservableLikeValue } from 'azure-devops-ui/Core/Observable';
import { Icon, IconSize, type IIconProps } from 'azure-devops-ui/Icon';
import { Observer } from 'azure-devops-ui/Observer';
import { Tooltip } from 'azure-devops-ui/TooltipEx';
import { css } from 'azure-devops-ui/Util';
import type { State } from '@/shared/components/StateIcon';

export type TextFieldCellProps = {
  value: IObservableLikeValue<string>;
  state: State;
  iconProps?: IIconProps;
  /** For contexts that already show the error elsewhere (the preview dialog
   * keeps its always-visible state icon on the right). */
  hideErrorIcon?: boolean;
} & Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  | 'className'
  | 'type'
  | 'readOnly'
  | 'required'
  | 'placeholder'
  | 'onChange'
  | 'onBlur'
  | 'onKeyDown'
  | 'onClick'
  | 'onDoubleClick'
  | 'onMouseDown'
  | 'autoFocus'
>;

export function TextFieldCell({
  value,
  state,
  iconProps,
  hideErrorIcon,
  className,
  ...inputProps
}: TextFieldCellProps) {
  const isPasswordField = inputProps.type === 'password';

  inputProps.placeholder ??= (isPasswordField && '******') || undefined;

  // A validation error takes over the prefix slot (same spot the mixed-secret
  // warning icon uses) so its tooltip stays reachable: the state slot on the
  // right swaps to an action button on hover.
  if (state.type === 'Error' && !hideErrorIcon) {
    iconProps = {
      iconName: 'Error',
      style: {
        paddingLeft: 0,
        marginLeft: 0,
        color: 'var(--status-error-foreground)',
      },
      size: IconSize.medium,
      tooltipProps: { text: state.message },
    };
  }

  return (
    <Observer value={value}>
      {({ value }) => {
        value ??= '';

        return (
          <span className="flex-row text-field-container">
            {iconProps && <Icon {...iconProps} />}
            <Tooltip
              text={value}
              disabled={isPasswordField}
              overflowOnly={true}
            >
              <input
                className={css(
                  'bolt-textfield-input text-ellipsis flex-grow',
                  iconProps && 'bolt-textfield-input-with-prefix',
                  state.type === 'Deleted' && 'state-deleted',
                  state.type === 'Error' && 'state-error',
                  className,
                )}
                value={value}
                spellCheck={false}
                disabled={state.type === 'Deleted'}
                data-form-type="other"
                {...inputProps}
              />
            </Tooltip>
          </span>
        );
      }}
    </Observer>
  );
}
