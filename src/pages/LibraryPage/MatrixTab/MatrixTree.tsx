import { Button } from 'azure-devops-ui/Button';
import { Card } from 'azure-devops-ui/Card';
import {
  type IReadonlyObservableArray,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { type ITreeColumn, Tree } from 'azure-devops-ui/TreeEx';
import { css } from 'azure-devops-ui/Util';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type {
  ITreeItem,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useMemo } from 'react';
import type { ObservableMatrixVariable } from '@/features/variable-groups/models';
import type { FilterFunc } from '@/shared/components/Table/useFiltering';
import { createActionColumn } from '@/shared/components/Tree/createActionColumn';
import { createExpandableActionColumn } from '@/shared/components/Tree/createExpandableActionColumn';
import { getRenderers } from '@/shared/components/Tree/createTreeColumns';
import { getLoadingProvider } from '@/shared/components/Tree/loadingProvider';
import type { TreeRenderer, TypedData } from '@/shared/components/Tree/types';
import { useObservableFiltering } from '@/shared/components/Tree/useFiltering';
import { useRowRenderer } from '@/shared/components/Tree/useRowRenderer';
import { folderRenderer, variableRenderer } from './renderers';

export type VariableGroupName = {
  id: number;
  name: string;
};

export type MatrixTreeProps = {
  items: IReadonlyObservableArray<ITreeItem<MatrixTreeItem>>;
  groupNames: VariableGroupName[];
  filter: IFilter;
  loading?: boolean;
  addNewVariable: () => void;
  onToggleItem?: (data: MatrixTreeItem, expanded: boolean) => void;
};

export type MatrixVariableFolder = {
  folderName: string;
  // Lowercased '/'-joined ancestor chain — identity for collapse tracking.
  folderPath: string;
  variables: ObservableMatrixVariable[];
};

export type MatrixTreeItem =
  | TypedData<'folder', MatrixVariableFolder>
  | TypedData<'variable', ObservableMatrixVariable>;

export type MatrixTreeColumns = 'name' | 'value';

export type MatrixTreeRenderer = TreeRenderer<
  MatrixTreeColumns,
  MatrixTreeItem
>;

const renderers: MatrixTreeRenderer = {
  folder: folderRenderer,
  variable: variableRenderer,
};

const filterFunc: FilterFunc<MatrixTreeItem> = (item, filterText) => {
  if (!filterText || !item) {
    return true;
  }

  switch (item.type) {
    case 'folder':
      return item.data.folderName?.toLocaleLowerCase().includes(filterText);
    case 'variable':
      return item.data.search(filterText);
  }
};

const useColumns = (
  groupNames: VariableGroupName[],
  itemProvider: ITreeItemProvider<MatrixTreeItem>,
) => {
  const columns = useMemo(() => {
    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const hasFolders = itemProvider.roots.some(
      (item) => item.data.type === 'folder',
    );

    const createNameColumn = hasFolders
      ? createExpandableActionColumn
      : createActionColumn;

    const columns: ITreeColumn<MatrixTreeItem>[] = [
      createNameColumn({
        id: 'name',
        name: 'Name',
        onSize,
        width: new ObservableValue(-20),
        className: css(!hasFolders && 'padding-left-12'),
        contentClassName: 'padding-vertical-0 padding-right-0',
        ...getRenderers('name', renderers, itemProvider),
      }),
      ...groupNames.map<ITreeColumn<MatrixTreeItem>>((groupName) =>
        createActionColumn({
          id: groupName.id.toString(),
          name: groupName.name,
          onSize,
          width: new ObservableValue(-15),
          ...getRenderers(
            'value',
            renderers,
            itemProvider,
            groupName.id.toString(),
            groupName.name,
          ),
        }),
      ),
    ];

    return columns;
  }, [groupNames, itemProvider]);

  return { columns };
};

export const MatrixTree = ({
  items,
  groupNames,
  filter,
  loading,
  addNewVariable,
  onToggleItem,
}: MatrixTreeProps) => {
  const { filteredItems, isEmpty } = useObservableFiltering(
    items,
    filter,
    filterFunc,
  );
  const { columns } = useColumns(groupNames, filteredItems);

  const renderRow = useRowRenderer(columns);
  return (
    (!loading && isEmpty && <span>No items found</span>) || (
      <div className="flex-column spacing-8">
        <Card
          className="flex-grow bolt-card-no-vertical-padding"
          contentProps={{ contentPadding: false }}
        >
          <Tree<MatrixTreeItem>
            id={'variables-tree'}
            className="text-field-table-wrap"
            columns={columns}
            itemProvider={loading ? getLoadingProvider() : filteredItems}
            showLines={false}
            virtualize={false}
            renderRow={renderRow}
            onToggle={(_, item) => {
              if (item.underlyingItem.childItems?.length) {
                const expanded = !item.underlyingItem.expanded;
                filteredItems.toggle(item.underlyingItem);
                onToggleItem?.(item.underlyingItem.data, expanded);
              }
            }}
          />
        </Card>
        <div className="flex-row margin-vertical-16">
          <Button
            iconProps={{ iconName: 'Add' }}
            text="Add new variable"
            onClick={addNewVariable}
          />
        </div>
      </div>
    )
  );
};
