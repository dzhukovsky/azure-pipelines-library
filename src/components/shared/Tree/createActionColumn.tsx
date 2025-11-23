import { ObservableLike } from 'azure-devops-ui/Core/Observable';
import { TableCell } from 'azure-devops-ui/Table';
import type { ITreeColumn } from 'azure-devops-ui/TreeEx';
import type { ITreeItemEx } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { memo } from 'react';

export type RenderHandler<T> = (options: RenderOptions<T>) => React.ReactNode;

export type ActionColumnOptions<T> = Omit<ITreeColumn<T>, 'renderCell'> & {
  renderCell: RenderHandler<T>;
  renderActions: RenderHandler<T>;
};

export type RenderOptions<T> = {
  rowIndex: number;
  treeItem: ITreeItemEx<T>;
  data: T;
};

export function createActionColumn<T>({
  renderCell,
  renderActions,
  ...options
}: ActionColumnOptions<T>): ITreeColumn<T> {
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
        <ActionCell
          key={columnIndex}
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          item={tableItem}
          column={tableColumn}
          ariaLabel={options.ariaLabel}
          ariaRowIndex={ariaRowIndex}
          role={role}
          renderCell={renderCell}
          renderActions={renderActions}
        />
      );
    },
  };
}

const ActionCell = memo(
  <T,>({
    rowIndex,
    columnIndex,
    item,
    column,
    renderCell,
    renderActions,
    ariaLabel,
    ariaRowIndex,
    role,
  }: {
    rowIndex: number;
    columnIndex: number;
    item: ITreeItemEx<T>;
    column: ITreeColumn<T>;
    ariaLabel?: string;
    ariaRowIndex?: number;
    role?: string;
    renderCell: (options: RenderOptions<T>) => React.ReactNode;
    renderActions: (options: RenderOptions<T>) => React.ReactNode;
  }) => {
    const data = ObservableLike.getValue(item.underlyingItem.data);
    const options: RenderOptions<T> = {
      rowIndex: rowIndex,
      treeItem: item,
      data,
    };

    return (
      <TableCell
        columnIndex={columnIndex}
        tableColumn={column}
        ariaLabel={ariaLabel}
        ariaRowIndex={ariaRowIndex}
        role={role}
      >
        <div className="flex-row flex-grow">
          {renderCell(options)}
          {renderActions(options)}
        </div>
      </TableCell>
    );
  },
);
