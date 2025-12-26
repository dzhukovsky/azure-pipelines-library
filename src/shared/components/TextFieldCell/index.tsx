import type { IObservableLikeValue } from 'azure-devops-ui/Core/Observable';
import { Icon, type IIconProps } from 'azure-devops-ui/Icon';
import { Observer } from 'azure-devops-ui/Observer';
import { Tooltip } from 'azure-devops-ui/TooltipEx';
import { css } from 'azure-devops-ui/Util';
import type { State } from '@/shared/components/State';

export type TextFieldCellProps = {
  value: IObservableLikeValue<string>;
  state: State;
  iconProps?: IIconProps;
} & Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'readOnly' | 'required' | 'placeholder' | 'onChange'
>;

export function TextFieldCell({
  value,
  state,
  iconProps,
  ...inputProps
}: TextFieldCellProps) {
  const isPasswordField = inputProps.type === 'password';

  inputProps.placeholder ??= (isPasswordField && '******') || undefined;

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
                  state.type === 'Deleted' && 'status-deleted',
                  state.type === 'Error' && 'input-validation-error',
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
