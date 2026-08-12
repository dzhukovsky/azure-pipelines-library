import { LastModifiedByCell } from '@/shared/components/LastModifiedByCell';
import type { HomeTreeRenderer } from '../../HomeTree';
import { GroupNameCell } from './GroupNameCell';
import { NameActions } from './NameActions';
import { ValueActions } from './ValueActions';

export const groupRenderer: HomeTreeRenderer['group'] = {
  name: {
    renderCell: ({ data }) => <GroupNameCell data={data} />,
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
