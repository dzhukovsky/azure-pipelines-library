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
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ObservableMatrixVariable } from '@/features/variable-groups/models';
import { createActionColumn } from '@/shared/components/Tree/createActionColumn';
import { createExpandableActionColumn } from '@/shared/components/Tree/createExpandableActionColumn';
import { getRenderers } from '@/shared/components/Tree/createTreeColumns';
import { getLoadingProvider } from '@/shared/components/Tree/loadingProvider';
import { selectTreeRowInput } from '@/shared/components/Tree/selectTreeRowInput';
import type { TreeItemProviderProp } from '@/shared/components/Tree/treeProps';
import type { TreeRenderer, TypedData } from '@/shared/components/Tree/types';
import type { FilterFunc } from '@/shared/components/Tree/useFiltering';
import { useObservableFiltering } from '@/shared/components/Tree/useFiltering';
import type { RowFocusChangeHandler } from '@/shared/components/Tree/useRowRenderer';
import { useRowRenderer } from '@/shared/components/Tree/useRowRenderer';
import { ComparisonPanel } from './ComparisonPanel';
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
  showComparison?: boolean;
  addNewVariable: () => ObservableMatrixVariable;
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
  showComparison,
  addNewVariable,
  onToggleItem,
}: MatrixTreeProps) => {
  const { filteredItems, isEmpty } = useObservableFiltering(
    items,
    filter,
    filterFunc,
  );
  const { columns } = useColumns(groupNames, filteredItems);

  const [focusedVariable, setFocusedVariable] =
    useState<ObservableMatrixVariable>();
  // "Last focus wins": moving focus between rows fires the new row's focus
  // before the old row's (debounced) blur, so a blur only clears the state
  // if its row is still the one being shown.
  const onRowFocusChange = useCallback<RowFocusChangeHandler<MatrixTreeItem>>(
    (item, hasFocus) => {
      const data = item.underlyingItem.data;
      if (data.type !== 'variable') {
        return;
      }

      setFocusedVariable((prev) =>
        hasFocus ? data.data : prev === data.data ? undefined : prev,
      );
    },
    [],
  );

  const renderRow = useRowRenderer(columns, onRowFocusChange);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  return (
    (!loading && isEmpty && <span>No items found</span>) || (
      <div className="flex-column spacing-8" ref={treeContainerRef}>
        <Card
          className="flex-grow bolt-card-no-vertical-padding"
          contentProps={{ contentPadding: false }}
        >
          <Tree<MatrixTreeItem>
            id={'variables-tree'}
            className="text-field-table-wrap"
            columns={columns}
            itemProvider={
              (loading
                ? getLoadingProvider()
                : filteredItems) as TreeItemProviderProp<MatrixTreeItem>
            }
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
        {showComparison && focusedVariable && (
          <ComparisonPanel variable={focusedVariable} groupNames={groupNames} />
        )}
        <div className="flex-row margin-vertical-16">
          <Button
            iconProps={{ iconName: 'Add' }}
            text="Add new variable"
            onClick={() => {
              const variable = addNewVariable();
              // Once React has flushed the rebuilt rows, find the new
              // variable's row by identity — its position depends on grouping
              // — and put the caret into its name field.
              window.requestAnimationFrame(() => {
                const rowIndex = filteredItems.value.findIndex(
                  (row) =>
                    row.underlyingItem.data.type === 'variable' &&
                    row.underlyingItem.data.data === variable,
                );
                selectTreeRowInput(treeContainerRef.current, rowIndex);
              });
            }}
          />
        </div>
      </div>
    )
  );
};
