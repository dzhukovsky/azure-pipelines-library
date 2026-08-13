import { LastModifiedByCell } from '@/shared/components/LastModifiedByCell';
import type { HomeTreeRenderer } from '../../HomeTree';
import { GroupNameCell } from './GroupNameCell';
import { NameActions } from './NameActions';
import { ValueActions } from './ValueActions';

export const groupRenderer: HomeTreeRenderer['group'] = {
  name: {
    renderCell: ({ data }) => <GroupNameCell data={data} />,
    renderActions: ({ data, rowIndex }) => (
      <NameActions data={data} rowIndex={rowIndex} />
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
