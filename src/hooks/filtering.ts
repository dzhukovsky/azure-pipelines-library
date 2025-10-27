import {
  type IReadonlyObservableArray,
  useObservableArray,
} from 'azure-devops-ui/Core/Observable';
import {
  FILTER_CHANGE_EVENT,
  type IFilter,
} from 'azure-devops-ui/Utilities/Filter';
import { useEffect, useState } from 'react';

export type FilterFunc<T> = (item: T, text: string) => boolean;

function filterItems<T>(
  items: T[],
  filter: IFilter,
  filterFunc: FilterFunc<T>,
) {
  if (!filter.hasChangesToReset()) {
    return [...items];
  }

  const filterText =
    filter.getFilterItemValue<string>('keyword')?.toLocaleLowerCase() ?? '';

  return items.filter((item) => filterFunc(item, filterText));
}

export function useFiltering<T>(
  items: IReadonlyObservableArray<T>,
  filter: IFilter,
  filterFunc: FilterFunc<T>,
) {
  const [filteredItems] = useObservableArray<T>(
    filterItems(items.value, filter, filterFunc),
  );
  const [hasItems, setHasItems] = useState<boolean>(
    filteredItems.value.length > 0,
  );

  useEffect(() => {
    const onChange = () => {
      const filtered = filterItems(items.value, filter, filterFunc);
      filteredItems.splice(0, filteredItems.length, ...filtered);
      setHasItems(filtered.length > 0);
    };

    filter.subscribe(onChange, FILTER_CHANGE_EVENT);
    items.subscribe(onChange);
    return () => {
      filter.unsubscribe(onChange, FILTER_CHANGE_EVENT);
      items.unsubscribe(onChange);
    };
  }, [items, filter, filterFunc, filteredItems]);

  return { filteredItems, hasItems };
}

export const useFilterSubscription = (filter: IFilter, onChange: () => void) =>
  useEffect(() => {
    filter.subscribe(onChange, FILTER_CHANGE_EVENT);
    return () => filter.unsubscribe(onChange, FILTER_CHANGE_EVENT);
  }, [filter, onChange]);
