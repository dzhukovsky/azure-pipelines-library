import { memo } from 'react';

export const SpacerColumn = memo(() => (
  <td
    aria-hidden="true"
    className="bolt-table-cell-compact bolt-table-cell bolt-list-cell bolt-table-spacer-cell"
    role="presentation"
  ></td>
));
