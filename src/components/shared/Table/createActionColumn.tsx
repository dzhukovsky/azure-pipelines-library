import { type ITableColumn, TableCell } from 'azure-devops-ui/Table';
import { memo } from 'react';
import { useTableRow } from './useTableRow';

export type ActionColumnOptions<T> = Omit<ITableColumn<T>, 'renderCell'> & {
  renderCell: (options: RenderOptions<T>) => React.ReactNode;
  renderActions: (options: RenderOptions<T>) => React.ReactNode;
};

export type RenderOptions<T> = {
  item: T;
  rowIndex: number;
  hasFocus: boolean;
  hasMouse: boolean;
};

export function createActionColumn<T>({
  renderCell,
  renderActions,
  ...options
}: ActionColumnOptions<T>): ITableColumn<T> {
  return {
    ...options,
    renderCell: (
      rowIndex,
      columnIndex,
      tableColumn,
      tableItem,
      ariaRowIndex,
      role,
    ) => {
      return (
        <TableCell
          key={`col-${columnIndex}`}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          ariaLabel={options.ariaLabel}
          ariaRowIndex={ariaRowIndex}
          role={role}
        >
          <ActionCell
            rowIndex={rowIndex}
            item={tableItem}
            renderCell={renderCell}
            renderActions={renderActions}
          />
        </TableCell>
      );
    },
  };
}

const ActionCell = memo(
  <T,>(props: {
    rowIndex: number;
    item: T;
    renderCell: (options: RenderOptions<T>) => React.ReactNode;
    renderActions: (options: RenderOptions<T>) => React.ReactNode;
  }) => {
    const { hasFocus, hasMouse } = useTableRow();

    const options: RenderOptions<T> = {
      rowIndex: props.rowIndex,
      item: props.item,
      hasFocus,
      hasMouse,
    };

    return (
      <div className="flex-row flex-grow">
        {props.renderCell(options)}
        {props.renderActions(options)}
      </div>
    );
  },
);
