import { ObservableLike } from 'azure-devops-ui/Core/Observable';
import { ExpandableTreeCell, type ITreeColumn } from 'azure-devops-ui/TreeEx';
import type { ITreeItemEx } from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { RenderHandler, RenderOptions } from './createActionColumn';

export type ActionColumnOptions<T> = Omit<ITreeColumn<T>, 'renderCell'> & {
  id: string;
  renderCell: RenderHandler<T>;
  renderActions: RenderHandler<T>;
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
      return (
        <ActionCell
          key={columnIndex}
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          item={tableItem}
          column={tableColumn}
          role={role}
          contentClassName={contentClassName}
          renderCell={renderCell}
          renderActions={renderActions}
        />
      );
    },
  };
}

const ActionCell = <T,>(props: {
  rowIndex: number;
  columnIndex: number;
  item: ITreeItemEx<T>;
  column: ITreeColumn<T>;
  contentClassName?: string;
  role?: string;
  renderCell: RenderHandler<T>;
  renderActions: RenderHandler<T>;
}) => {
  const data = ObservableLike.getValue(props.item.underlyingItem.data);
  const options: RenderOptions<T> = {
    rowIndex: props.rowIndex,
    treeItem: props.item,
    data,
  };

  return (
    <ExpandableTreeCell
      contentClassName={props.contentClassName}
      columnIndex={props.columnIndex}
      treeItem={props.item}
      treeColumn={props.column}
      role={props.role}
    >
      <div className="flex-row flex-grow">
        {props.renderCell(options)}
        {props.renderActions(options)}
      </div>
    </ExpandableTreeCell>
  );
};
