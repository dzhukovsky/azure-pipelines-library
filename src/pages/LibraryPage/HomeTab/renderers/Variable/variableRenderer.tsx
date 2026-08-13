import { Observer } from 'azure-devops-ui/Observer';
import { secretNameIconProps } from '@/shared/components/SecretVariableType';
import { TextFieldCell } from '@/shared/components/TextFieldCell';
import type { HomeTreeRenderer } from '../../HomeTree';
import { NameActions } from './NameActions';
import { ValueActions } from './ValueActions';

export const variableRenderer: HomeTreeRenderer['groupVariable'] = {
  name: {
    renderCell: ({ data }) => (
      <Observer state={data.state} isSecret={data.isSecret}>
        {({ state, isSecret }) => (
          <TextFieldCell
            value={data.name}
            state={state}
            placeholder="Name (required)"
            iconProps={secretNameIconProps(isSecret)}
            onChange={(e) => {
              data.name.value = e.target.value;
            }}
          />
        )}
      </Observer>
    ),
    renderActions: ({ data }) => <NameActions data={data} />,
  },
  value: {
    renderCell: ({ data }) => (
      <Observer state={data.state} isSecret={data.isSecret}>
        {({ state, isSecret }) => (
          <TextFieldCell
            value={data.value}
            state={state}
            type={isSecret ? 'password' : 'text'}
            onChange={(e) => {
              data.value.value = e.target.value;
            }}
          />
        )}
      </Observer>
    ),
    renderActions: ({ data, treeItem }) => (
      <ValueActions data={data} treeItem={treeItem} />
    ),
  },
};
