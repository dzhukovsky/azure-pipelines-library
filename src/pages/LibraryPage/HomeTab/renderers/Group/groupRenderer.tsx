import { IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { LastModifiedByCell } from '@/shared/components/LastModifiedByCell';
import type { HomeTreeRenderer } from '../../HomeTree';
import { NameActions } from './NameActions';
import { ValueActions } from './ValueActions';

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
    renderActions: ({ data, treeItem, rowIndex }) => (
      <NameActions data={data} treeItem={treeItem} rowIndex={rowIndex} />
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
    renderActions: ({ data }) => <ValueActions data={data} />,
  },
};
