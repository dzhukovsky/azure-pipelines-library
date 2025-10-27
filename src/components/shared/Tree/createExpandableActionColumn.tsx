import { ObservableLike } from 'azure-devops-ui/Core/Observable';
import { ExpandableTreeCell, type ITreeColumn } from 'azure-devops-ui/TreeEx';
import { useTableRow } from '../Table/useTableRow';

export type ActionColumnOptions<T> = Omit<ITreeColumn<T>, 'renderCell'> & {
  id: string;
  renderCell: (item: T) => React.ReactNode;
  renderActions: (
    rowIndex: number,
    item: T,
    hasFocus: boolean,
    hasMouse: boolean,
  ) => React.ReactNode;
  contentClassName?: string;
};

export function createExpandableActionColumn<T>({
  renderCell,
  renderActions,
  contentClassName,
  ...options
}: ActionColumnOptions<T>): ITreeColumn<T> {
  return {
    ...options,
    renderCell: (
      rowIndex,
      columnIndex,
      tableColumn,
      tableItem,
      _ariaRowIndex,
      role,
    ) => {
      const data = ObservableLike.getValue(tableItem.underlyingItem.data);

      return (
        <ExpandableTreeCell
          key={`col-${columnIndex}`}
          contentClassName={contentClassName}
          columnIndex={columnIndex}
          treeItem={tableItem}
          treeColumn={tableColumn}
          role={role}
        >
          <ActionCell
            rowIndex={rowIndex}
            item={data}
            renderCell={renderCell}
            renderActions={renderActions}
          />
        </ExpandableTreeCell>
      );
    },
  };
}

function ActionCell<T>(props: {
  rowIndex: number;
  item: T;
  renderCell: (item: T) => React.ReactNode;
  renderActions: (
    rowIndex: number,
    item: T,
    hasFocus: boolean,
    hasMouse: boolean,
  ) => React.ReactNode;
}) {
  const { hasFocus, hasMouse } = useTableRow();

  return (
    <div className="flex-row flex-grow">
      {props.renderCell(props.item)}
      {props.renderActions(props.rowIndex, props.item, hasFocus, hasMouse)}
    </div>
  );
}
