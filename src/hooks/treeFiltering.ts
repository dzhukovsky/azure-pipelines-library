import {
  FILTER_CHANGE_EVENT,
  type IFilter,
} from 'azure-devops-ui/Utilities/Filter';
import {
  type ITreeItem,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useEffect, useMemo, useState } from 'react';
import type { FilterFunc } from './filtering';

function filterItems<T>(
  items: ITreeItem<T>[],
  filter: IFilter,
  filterFunc: FilterFunc<T>,
): ITreeItem<T>[] {
  const filterText =
    filter.getFilterItemValue<string>('keyword')?.toLocaleLowerCase() ?? '';

  return items
    .map((item) => ({
      ...item,
      expanded: !!filterText,
      childItems: filterItems(item.childItems ?? [], filter, filterFunc),
    }))
    .filter(
      (item) => !!item.childItems?.length || filterFunc(item.data, filterText),
    );
}

export function useFiltering<T>(
  items: ITreeItem<T>[],
  filter: IFilter,
  filterFunc: FilterFunc<T>,
) {
  const filteredItems = useMemo(() => new TreeItemProvider<T>(), []);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const onChange = () => {
      const filtered = filterItems(items, filter, filterFunc);
      filteredItems.splice(undefined, filteredItems.roots, [
        {
          items: filtered,
        },
      ]);
      setIsEmpty(filtered.length === 0);
    };

    onChange();

    filter.subscribe(onChange, FILTER_CHANGE_EVENT);
    return () => filter.unsubscribe(onChange, FILTER_CHANGE_EVENT);
  }, [items, filter, filterFunc, filteredItems]);

  return { filteredItems, isEmpty };
}
