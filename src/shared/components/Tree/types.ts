import type {
  ITreeItemEx,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';

export type TypedData<K extends string = string, T = unknown> = {
  type: K;
  data: T;
};

export type ColumnRenderer<TData extends TypedData> = {
  renderCell: RenderHandler<TData>;
  renderActions: RenderHandler<TData>;
};

export type RowRenderer<
  TColumns extends string,
  TData extends TypedData,
> = Record<TColumns, ColumnRenderer<TData>>;

export type TreeRenderer<TColumns extends string, TData extends TypedData> = {
  [K in TData['type']]: RowRenderer<TColumns, Extract<TData, { type: K }>>;
};

export type RenderHandler<TData extends TypedData> = (options: {
  rowIndex: number;
  treeItem: ITreeItemEx<TData>;
  data: TData['data'];
  provider: ITreeItemProvider<TData>;
}) => React.ReactNode;
