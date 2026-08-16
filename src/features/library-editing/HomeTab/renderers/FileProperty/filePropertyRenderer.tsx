import { renderListCell } from 'azure-devops-ui/List';
import { States } from '@/shared/components/StateIcon';
import { TextFieldCell } from '@/shared/components/TextFieldCell';
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
    // Rendered through TextFieldCell (read-only) rather than as bare text so
    // the value lines up with the editable variable values above it: the
    // text field supplies the horizontal padding, which plain text lacks.
    renderCell: ({ data }) => (
      <TextFieldCell value={data.value} state={States.Unchanged} readOnly />
    ),
    renderActions: () => null,
  },
};
