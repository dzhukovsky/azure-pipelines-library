import { IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { LastModifiedByCell } from '@/shared/components/LastModifiedByCell';
import { GroupNameActionsCell } from '../ActionCells/GroupNameActionsCell';
import { GroupValueActionsCell } from '../ActionCells/GroupValueActionsCell';
import type { HomeTreeRenderer } from '../VariablesTree';

export const groupRenderer: HomeTreeRenderer['group'] = {
  name: {
    renderCell: ({ data }) =>
      renderListCell({
        text: data.name.value,
        textClassName: 'padding-vertical-8',
        iconProps: {
          iconName: 'fluent-LibraryColor',
          size: IconSize.medium,
        },
      }),
    renderActions: ({ data, treeItem, rowIndex, provider }) => (
      <GroupNameActionsCell
        data={data}
        treeItem={treeItem}
        rowIndex={rowIndex}
        itemProvider={provider}
      />
    ),
  },
  value: {
    renderCell: ({ data }) =>
      data.modifiedBy &&
      data.modifiedOn && (
        <LastModifiedByCell
          modifiedBy={data.modifiedBy}
          modifiedOn={data.modifiedOn}
        />
      ),
    renderActions: ({ data }) => <GroupValueActionsCell data={data} />,
  },
};
