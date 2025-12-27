import { Card } from 'azure-devops-ui/Card';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import {
  type ITreeColumn,
  renderTreeRow,
  Tree,
  type TreeRowRenderer,
} from 'azure-devops-ui/TreeEx';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type {
  ITreeItem,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useCallback, useMemo } from 'react';
import type {
  ObservableSecureFile,
  ObservableSecureFileProperty,
} from '@/features/secure-files/models';
import type {
  ObservableVariable,
  ObservableVariableGroup,
} from '@/features/variable-groups/models';
import type { FilterFunc } from '@/shared/components/Table/useFiltering';
import { createActionColumn } from '@/shared/components/Tree/createActionColumn';
import { createExpandableActionColumn } from '@/shared/components/Tree/createExpandableActionColumn';
import { getLoadingProvider } from '@/shared/components/Tree/loadingProvider';
import type { TreeRenderer, TypedData } from '@/shared/components/Tree/types';
import { useFiltering } from '@/shared/components/Tree/useFiltering';
import { useRowRenderer } from '@/shared/components/Tree/useRowRenderer';
import { filePropertyRenderer } from './renderers/filePropertyRenderer';
import { fileRenderer } from './renderers/fileRenderer';
import { groupRenderer } from './renderers/groupRenderer';
import { variableRenderer } from './renderers/variableRenderer';

export type VariablesTreeProps = {
  items: ITreeItem<HomeTreeItem>[];
  filter: IFilter;
  loading?: boolean;
};

export type HomeTreeItem =
  | TypedData<'group', ObservableVariableGroup>
  | TypedData<'groupVariable', ObservableVariable>
  | TypedData<'file', ObservableSecureFile>
  | TypedData<'fileProperty', ObservableSecureFileProperty>;

export type HomeTreeColumns = 'name' | 'value';

export type HomeTreeRenderer = TreeRenderer<HomeTreeColumns, HomeTreeItem>;

const renderers: HomeTreeRenderer = {
  group: groupRenderer,
  groupVariable: variableRenderer,
  file: fileRenderer,
  fileProperty: filePropertyRenderer,
};

const useColumns = (itemProvider: ITreeItemProvider<HomeTreeItem>) => {
  const columns = useMemo(() => {
    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns: ITreeColumn<HomeTreeItem>[] = [
      createExpandableActionColumn<HomeTreeItem>({
        id: 'name',
        name: 'Name',
        contentClassName: 'padding-vertical-0 padding-right-0',
        onSize,
        renderCell: (options) => {
          const renderer = renderers[options.data.type];
          return renderer.name.renderCell({
            rowIndex: options.rowIndex,
            treeItem: options.treeItem,
            data: options.data.data,
            provider: itemProvider,
          });
        },
        renderActions: (options) => {
          const renderer = renderers[options.data.type];
          return renderer.name.renderActions({
            rowIndex: options.rowIndex,
            treeItem: options.treeItem,
            data: options.data.data,
            provider: itemProvider,
          });
        },
        width: new ObservableValue(-25),
      }),
      createActionColumn<HomeTreeItem>({
        id: 'value',
        name: 'Value / Last modified by',
        width: new ObservableValue(-75),
        renderCell: (options) => {
          const renderer = renderers[options.data.type];
          return renderer.value.renderCell({
            rowIndex: options.rowIndex,
            treeItem: options.treeItem,
            data: options.data.data,
            provider: itemProvider,
          });
        },
        renderActions: (options) => {
          const renderer = renderers[options.data.type];
          return renderer.value.renderActions({
            rowIndex: options.rowIndex,
            treeItem: options.treeItem,
            data: options.data.data,
            provider: itemProvider,
          });
        },
      }),
    ];

    return columns;
  }, [itemProvider]);

  const renderRow = useCallback<TreeRowRenderer<HomeTreeItem>>(
    (rowIndex, item, details) => {
      const data = item.underlyingItem.data;
      const className =
        data.type === 'groupVariable' ? 'text-field-row' : undefined;

      return renderTreeRow(rowIndex, item, details, columns, data, className);
    },
    [columns],
  );

  return { columns, renderRow };
};

const filterFunc: FilterFunc<HomeTreeItem> = (item, filterText) => {
  if (!filterText || !item) {
    return true;
  }

  switch (item.type) {
    case 'group':
    case 'file':
      return item.data.name.value?.toLocaleLowerCase().includes(filterText);
    case 'groupVariable':
    case 'fileProperty':
      return (
        item.data.name.value?.toLocaleLowerCase().includes(filterText) ||
        item.data.value.value?.toLocaleLowerCase().includes(filterText)
      );
  }
};

export const VariablesTree = ({
  items,
  filter,
  loading,
}: VariablesTreeProps) => {
  const { filteredItems, isEmpty } = useFiltering(items, filter, filterFunc);
  const { columns } = useColumns(filteredItems);

  const renderRow = useRowRenderer(columns);
  return (
    (!loading && isEmpty && <span>No items found</span>) || (
      <Card
        className="flex-grow bolt-card-no-vertical-padding"
        contentProps={{ contentPadding: false }}
      >
        <Tree<HomeTreeItem>
          id={'variables-tree'}
          className="text-field-table-wrap"
          columns={columns}
          itemProvider={loading ? getLoadingProvider() : filteredItems}
          showLines={false}
          virtualize={false}
          renderRow={renderRow}
          onToggle={(_, item) => {
            if (item.underlyingItem.childItems?.length) {
              filteredItems.toggle(item.underlyingItem);
            }
          }}
        />
      </Card>
    )
  );
};
