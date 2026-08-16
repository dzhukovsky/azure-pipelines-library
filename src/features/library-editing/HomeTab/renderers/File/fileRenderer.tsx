import { IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { LastModifiedByCell } from '@/shared/components/LastModifiedByCell';
import type { HomeTreeRenderer } from '../../HomeTree';

export const fileRenderer: HomeTreeRenderer['file'] = {
  name: {
    renderCell: ({ data }) =>
      renderListCell({
        text: data.name.value,
        textClassName: 'padding-vertical-8',
        iconProps: {
          iconName: 'fluent-DocumentKeyRegular',
          size: IconSize.medium,
        },
      }),
    renderActions: () => null,
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
    renderActions: () => null,
  },
};
