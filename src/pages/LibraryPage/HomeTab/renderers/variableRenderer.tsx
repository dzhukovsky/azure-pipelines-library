import { IconSize } from 'azure-devops-ui/Icon';
import { Observer } from 'azure-devops-ui/Observer';
import { TextFieldCell } from '@/shared/components/TextFieldCell';
import { VariableNameActionsCell } from '../ActionCells/VariableNameActionsCell';
import { VariableValueActionsCell } from '../ActionCells/VariableValueActionsCell';
import type { HomeTreeRenderer } from '../VariablesTree';

export const variableRenderer: HomeTreeRenderer['groupVariable'] = {
  name: {
    renderCell: ({ data }) => (
      <Observer state={data.state} isSecret={data.isSecret}>
        {({ state, isSecret }) => (
          <TextFieldCell
            value={data.name}
            state={state}
            iconProps={{
              iconName: isSecret
                ? 'fluent-KeyRegular'
                : 'fluent-MathFormulaRegular',
              style: {
                paddingLeft: 0,
                marginLeft: 0,
              },
              size: IconSize.medium,
            }}
            onChange={(e) => {
              data.name.value = e.target.value;
            }}
          />
        )}
      </Observer>
    ),
    renderActions: ({ data, treeItem, provider }) => (
      <VariableNameActionsCell
        data={data}
        treeItem={treeItem}
        itemProvider={provider}
      />
    ),
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
    renderActions: ({ data }) => <VariableValueActionsCell data={data} />,
  },
};
