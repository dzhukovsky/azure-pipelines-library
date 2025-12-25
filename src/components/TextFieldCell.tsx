import {
  type IObservableLikeValue,
  ObservableLike,
} from 'azure-devops-ui/Core/Observable';
import type { IIconProps } from 'azure-devops-ui/Icon';
import {
  type ITextFieldProps,
  TextField,
  TextFieldStyle,
  TextFieldWidth,
} from 'azure-devops-ui/TextField';
import { css } from 'azure-devops-ui/Util';
import type { State } from './shared/State';

export type TextFieldCellProps = {
  value: IObservableLikeValue<string>;
  state: State;
  iconProps?: IIconProps;
  textFieldProps?: Pick<
    ITextFieldProps,
    'placeholder' | 'inputType' | 'readOnly' | 'required' | 'onChange'
  >;
};

export function TextFieldCell({
  value,
  state,
  iconProps,
  textFieldProps,
}: TextFieldCellProps) {
  const placeholder =
    textFieldProps?.placeholder ||
    (textFieldProps?.inputType === 'password' && '******') ||
    undefined;

  return (
    <TextField
      {...textFieldProps}
      spellCheck={false}
      placeholder={placeholder}
      tooltipProps={{
        disabled: textFieldProps?.inputType === 'password',
        overflowOnly: true,
        renderContent: () => ObservableLike.getValue(value),
      }}
      prefixIconProps={iconProps}
      className="text-field"
      inputClassName={css(
        'text-ellipsis text-field-input',
        state.type === 'Deleted' && 'status-deleted',
        state.type === 'Error' && 'input-validation-error',
      )}
      disabled={state.type === 'Deleted'}
      containerClassName="text-field-container"
      width={TextFieldWidth.auto}
      style={TextFieldStyle.inline}
      value={value}
    ></TextField>
  );
}
