import { Observer } from 'azure-devops-ui/Observer';
import { css } from 'azure-devops-ui/Util';
import { secretNameIconProps } from '@/shared/components/SecretVariableType';
import { TextFieldCell } from '@/shared/components/TextFieldCell';
import type { MatrixTreeRenderer } from '../MatrixTree';
import { NameActions } from './NameActions';
import { ValueActions } from './ValueActions';

export const variableRenderer: MatrixTreeRenderer['variable'] = {
  name: {
    renderCell: ({ data }) => (
      <Observer state={data.name.state} isSecret={data.name.isSecret}>
        {({ state, isSecret }) => (
          <TextFieldCell
            value={data.name.name}
            state={state}
            placeholder="Name (required)"
            iconProps={secretNameIconProps(isSecret)}
            onChange={(e) => {
              data.name.name.value = e.target.value;
            }}
          />
        )}
      </Observer>
    ),
    renderActions: ({ data }) => <NameActions data={data} />,
  },
  value: {
    renderCell: ({ data, columnId }) => {
      const variable = data.values[+columnId];
      if (!variable) {
        return null;
      }

      return (
        <Observer
          state={variable.state}
          present={variable.present}
          isSecret={data.name.isSecret}
        >
          {({ state, present, isSecret }) => {
            const isUndefined = variable.isNew && !present;

            return (
              <TextFieldCell
                value={variable.value}
                state={state}
                type={
                  (isSecret ?? variable.isSecretInitial) ? 'password' : 'text'
                }
                className={css(isUndefined && 'text-null')}
                readOnly={isUndefined}
                placeholder={isUndefined ? 'NULL' : undefined}
                onChange={(e) => {
                  variable.value.value = e.target.value;
                }}
              />
            );
          }}
        </Observer>
      );
    },
    renderActions: ({ data, columnId }) => {
      const variable = data.values[+columnId];
      if (!variable) {
        return null;
      }
      return (
        <ValueActions data={variable} variable={data} groupId={+columnId} />
      );
    },
  },
};
