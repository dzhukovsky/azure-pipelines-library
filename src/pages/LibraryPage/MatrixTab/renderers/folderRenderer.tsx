import { IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import type { MatrixTreeRenderer } from '../MatrixTree';

export const folderRenderer: MatrixTreeRenderer['folder'] = {
  name: {
    renderCell: ({ data }) =>
      renderListCell({
        text: data.folderName,
        textClassName: 'padding-vertical-8 min-width-0',
        iconProps: {
          iconName: 'FabricFolderFill',
          size: IconSize.medium,
          style: { color: 'var(--icon-folder-color)' },
        },
      }),
    renderActions: () => null,
  },
  value: {
    renderCell: () => null,
    renderActions: () => null,
  },
};
