import { ObservableLike } from 'azure-devops-ui/Core/Observable';
import { FocusOrMouseWithin } from 'azure-devops-ui/FocusOrMouseWithin';
import type { IFocusWithinStatus } from 'azure-devops-ui/FocusWithin';
import type { IMouseWithinStatus } from 'azure-devops-ui/MouseWithin';
import { TableCell } from 'azure-devops-ui/Table';
import type { ITreeColumn } from 'azure-devops-ui/TreeEx';
import type { ITreeItemEx } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { memo } from 'react';
import { TreeCellContext } from './useTreeCell';

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

type ActionCellProps<T> = {
  rowIndex: number;
  columnIndex: number;
  item: ITreeItemEx<T>;
  column: ITreeColumn<T>;
  ariaLabel?: string;
  ariaRowIndex?: number;
  role?: string;
  renderCell: RenderHandler<T>;
  renderActions: RenderHandler<T>;
};

// memo() erases the generic call signature; the cast restores it so callers
// keep their element type instead of collapsing to `unknown`.
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
  }: ActionCellProps<T>) => {
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
        <FocusOrMouseWithin>
          {(props: IMouseWithinStatus & IFocusWithinStatus) => (
            <div
              role="none"
              className="flex-row flex-grow min-width-0"
              onBlur={props.onBlur}
              onFocus={props.onFocus}
              onMouseEnter={props.onMouseEnter}
              onMouseLeave={props.onMouseLeave}
            >
              <TreeCellContext.Provider value={props}>
                {renderCell(options)}
                {renderActions(options)}
              </TreeCellContext.Provider>
            </div>
          )}
        </FocusOrMouseWithin>
      </TableCell>
    );
  },
) as <T>(props: ActionCellProps<T>) => React.ReactElement;
