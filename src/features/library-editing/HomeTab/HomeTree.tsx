import { Card } from 'azure-devops-ui/Card';
import {
  type IReadonlyObservableArray,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import {
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
import { goToNewVariableGroup } from '@/features/variable-groups/newVariableGroup';
import { logoUrl } from '@/shared/assets/logo';
import { EmptyState } from '@/shared/components/EmptyState';
import { createTreeColumns } from '@/shared/components/Tree/createTreeColumns';
import { getLoadingProvider } from '@/shared/components/Tree/loadingProvider';
import type { TreeItemProviderProp } from '@/shared/components/Tree/treeProps';
import type { TreeRenderer, TypedData } from '@/shared/components/Tree/types';
import type { FilterFunc } from '@/shared/components/Tree/useFiltering';
import { useObservableFiltering } from '@/shared/components/Tree/useFiltering';
import { useRowRenderer } from '@/shared/components/Tree/useRowRenderer';
import {
  filePropertyRenderer,
  fileRenderer,
  groupRenderer,
  variableRenderer,
} from './renderers';

export type HomeTreeProps = {
  items: IReadonlyObservableArray<ITreeItem<HomeTreeItem>>;
  filter: IFilter;
  loading?: boolean;
  onToggleItem?: (
    data: ObservableVariableGroup | ObservableSecureFile,
    expanded: boolean,
  ) => void;
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
    const onSize = (
      _event: MouseEvent | KeyboardEvent,
      index: number,
      width: number,
    ) => {
      const column = columns[index];
      if (column) {
        (column.width as ObservableValue<number>).value = width;
      }
    };

    return createTreeColumns({
      columns: {
        name: {
          name: 'Name',
          onSize,
          width: new ObservableValue(-25),
        },
        value: {
          name: 'Value / Last modified by',
          width: new ObservableValue(-75),
        },
      },
      renderers,
      itemProvider,
    });
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

export const HomeTree = ({
  items,
  filter,
  loading,
  onToggleItem,
}: HomeTreeProps) => {
  const { filteredItems, isEmpty } = useObservableFiltering(
    items,
    filter,
    filterFunc,
  );
  const { columns } = useColumns(filteredItems);

  const renderRow = useRowRenderer(columns);
  const hasFilter = !!filter.getFilterItemValue<string>('keyword');
  return (
    (!loading && isEmpty && <HomeEmptyState hasFilter={hasFilter} />) || (
      <Card
        className="flex-grow bolt-card-no-vertical-padding"
        contentProps={{ contentPadding: false }}
      >
        <Tree<HomeTreeItem>
          id={'variables-tree'}
          className="text-field-table-wrap"
          columns={columns}
          itemProvider={
            (loading
              ? getLoadingProvider()
              : filteredItems) as TreeItemProviderProp<HomeTreeItem>
          }
          showLines={false}
          virtualize={false}
          renderRow={renderRow}
          onToggle={(_, item) => {
            const data = item.underlyingItem.data;
            if (item.underlyingItem.childItems?.length) {
              filteredItems.toggle(item.underlyingItem);
              if (data.type === 'group' || data.type === 'file') {
                onToggleItem?.(data.data, !!item.underlyingItem.expanded);
              }
            }
          }}
        />
      </Card>
    )
  );
};

const HomeEmptyState = ({ hasFilter }: { hasFilter: boolean }) =>
  hasFilter ? (
    <EmptyState
      iconName="Search"
      primaryText="No matching items"
      secondaryText="No variable groups, variables or secure files match your filter."
    />
  ) : (
    <EmptyState
      imagePath={logoUrl}
      primaryText="No variable groups or secure files yet"
      secondaryText="Store and share variables and secure files across your pipelines. Advanced Library lets you edit every group inline, compare them side by side across environments, and review your changes before saving."
      action={{ text: 'New variable group', onClick: goToNewVariableGroup }}
    />
  );
