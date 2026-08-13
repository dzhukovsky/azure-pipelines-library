import type { ITreeColumn } from 'azure-devops-ui/TreeEx';
import type { ITreeItemProvider } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { createActionColumn, type RenderHandler } from './createActionColumn';
import { createExpandableActionColumn } from './createExpandableActionColumn';
import { getRenderer, type TreeRenderer, type TypedData } from './types';

export type ColumnOptions<TColumns extends string, TData> = Record<
  TColumns,
  Omit<ITreeColumn<TData>, 'id' | 'renderCell'>
>;

export type CreateTreeColumnOptions<
  TData extends TypedData,
  TColumns extends string,
  TTreeRenderer extends TreeRenderer<TColumns, TData>,
> = {
  columns: ColumnOptions<TColumns, TData>;
  renderers: TTreeRenderer;
  itemProvider: ITreeItemProvider<TData>;
};

export function createTreeColumns<
  TData extends TypedData,
  TColumns extends string,
  TTreeRenderer extends TreeRenderer<TColumns, TData>,
>({
  columns,
  renderers,
  itemProvider,
}: CreateTreeColumnOptions<
  TData,
  TColumns,
  TTreeRenderer
>): ITreeColumn<TData>[] {
  return entries(columns).map(([id, column], index) =>
    index === 0
      ? createExpandableActionColumn<TData>({
          ...column,
          id,
          ...getRenderers(id, renderers, itemProvider, id, column.name),
          contentClassName: 'padding-vertical-0 padding-right-0',
        })
      : createActionColumn<TData>({
          ...column,
          id,
          ...getRenderers(id, renderers, itemProvider),
        }),
  );
}

function entries<K extends string, V>(obj: Record<K, V>): [K, V][] {
  return Object.entries(obj) as [K, V][];
}

export function getRenderers<
  TData extends TypedData,
  TColumns extends string,
  TTreeRenderer extends TreeRenderer<TColumns, TData>,
>(
  rendererName: TColumns,
  renderers: TTreeRenderer,
  itemProvider: ITreeItemProvider<TData>,
  columnId?: string,
  columnName?: string,
): {
  renderCell: RenderHandler<TData>;
  renderActions: RenderHandler<TData>;
} {
  return {
    renderCell: (options) => {
      const renderer = getRenderer(renderers, options.data.type);
      return (
        renderer[rendererName]?.renderCell({
          rowIndex: options.rowIndex,
          treeItem: options.treeItem,
          data: options.data.data,
          provider: itemProvider,
          columnId: columnId ?? rendererName,
          columnName: columnName ?? rendererName,
        }) ?? null
      );
    },
    renderActions: (options) => {
      const renderer = getRenderer(renderers, options.data.type);
      return (
        renderer[rendererName]?.renderActions({
          rowIndex: options.rowIndex,
          treeItem: options.treeItem,
          data: options.data.data,
          provider: itemProvider,
          columnId: columnId ?? rendererName,
          columnName: columnName ?? rendererName,
        }) ?? null
      );
    },
  };
}
