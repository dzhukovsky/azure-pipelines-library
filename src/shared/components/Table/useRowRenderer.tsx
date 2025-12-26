import { FocusOrMouseWithin } from 'azure-devops-ui/FocusOrMouseWithin';
import type { IFocusWithinStatus } from 'azure-devops-ui/FocusWithin';
import type { IMouseWithinStatus } from 'azure-devops-ui/MouseWithin';
import {
  type ITableColumn,
  renderColumns,
  type TableRowRenderer,
} from 'azure-devops-ui/Table';
import { css, getSafeIdWithSymbolConversion } from 'azure-devops-ui/Util';
import { useCallback } from 'react';
import { SpacerColumn } from './SpacerColumn';
import { TableRowContext } from './useTableRow';

export function useRowRenderer<T>(columns: ITableColumn<T>[]) {
  const renderRow = useCallback<TableRowRenderer<T>>(
    (index, item, details) => {
      return (
        <FocusOrMouseWithin key={index}>
          {(props: IMouseWithinStatus & IFocusWithinStatus) => (
            <tr
              id={getSafeIdWithSymbolConversion(details.id)}
              data-row-index={index}
              onBlur={props.onBlur}
              onFocus={props.onFocus}
              onMouseEnter={props.onMouseEnter}
              onMouseLeave={props.onMouseLeave}
              className={css(
                details.className,
                'bolt-table-row bolt-list-row',
                index === 0 && 'first-row',
                props.hasFocus && 'focused',
              )}
            >
              <SpacerColumn key="left-spacer" />
              <TableRowContext.Provider value={props}>
                {renderColumns(index, columns, item, details)}
              </TableRowContext.Provider>
              <SpacerColumn key="right-spacer" />
            </tr>
          )}
        </FocusOrMouseWithin>
      );
    },
    [columns],
  );

  return renderRow;
}
