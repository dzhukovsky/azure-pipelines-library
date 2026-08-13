import { renderListCell } from 'azure-devops-ui/List';
import type { HomeTreeRenderer } from '../../HomeTree';

export const filePropertyRenderer: HomeTreeRenderer['fileProperty'] = {
  name: {
    renderCell: ({ data }) =>
      renderListCell({
        text: data.name.value,
        textClassName: 'padding-vertical-8',
      }),
    renderActions: () => null,
  },
  value: {
    renderCell: ({ data }) => data.value.value,
    renderActions: () => null,
  },
};
