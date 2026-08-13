import type { IReadonlyObservableArray } from 'azure-devops-ui/Core/Observable';
import {
  FILTER_CHANGE_EVENT,
  type IFilter,
} from 'azure-devops-ui/Utilities/Filter';
import {
  type ITreeItem,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useCallback, useEffect, useRef, useState } from 'react';

export type FilterFunc<T> = (item: T, text: string) => boolean;

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
      // Force-expand while filtering so matches stay visible; otherwise
      // respect the source item's own expansion state (auto-expand on add,
      // manual user toggles) instead of always collapsing it.
      expanded: filterText ? true : !!item.expanded,
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
  // Seeded synchronously (on mount and whenever the items array is replaced)
  // so the first render already has the filtered rows — filling the provider
  // from an effect leaves a frame where the tree looks empty.
  const seed = useCallback(() => {
    const filteredItems = new TreeItemProvider<T>();
    const filtered = filterItems(items, filter, filterFunc);
    filteredItems.splice(undefined, filteredItems.roots, [
      {
        items: filtered,
      },
    ]);
    return { items, filteredItems, isEmpty: filtered.length === 0 };
  }, [items, filter, filterFunc]);

  const [state, setState] = useState(seed);
  const seededFor = useRef<ITreeItem<T>[] | null>(items);

  if (state.items !== items) {
    seededFor.current = items;
    setState(seed());
  }

  const filteredItems = state.filteredItems;

  useEffect(() => {
    const onChange = () => {
      const filtered = filterItems(items, filter, filterFunc);
      filteredItems.splice(undefined, filteredItems.roots, [
        {
          items: filtered,
        },
      ]);
      setState((prev) => ({ ...prev, isEmpty: filtered.length === 0 }));
    };

    // The render-time seed already covers the state this effect run was
    // scheduled for; recompute only when the effect re-runs for other reasons.
    if (seededFor.current === items) {
      seededFor.current = null;
    } else {
      onChange();
    }

    filter.subscribe(onChange, FILTER_CHANGE_EVENT);
    return () => filter.unsubscribe(onChange, FILTER_CHANGE_EVENT);
  }, [items, filter, filterFunc, filteredItems]);

  return { filteredItems, isEmpty: state.isEmpty };
}

export const useFilterSubscription = (filter: IFilter, onChange: () => void) =>
  useEffect(() => {
    filter.subscribe(onChange, FILTER_CHANGE_EVENT);
    return () => filter.unsubscribe(onChange, FILTER_CHANGE_EVENT);
  }, [filter, onChange]);

export function useObservableFiltering<T>(
  items: IReadonlyObservableArray<ITreeItem<T>>,
  filter: IFilter,
  filterFunc: FilterFunc<T>,
) {
  // Seeded synchronously (on mount and whenever the items observable is
  // swapped) so the first render already has the filtered rows — filling the
  // provider from an effect leaves a frame where the tree looks empty.
  const seed = useCallback(() => {
    const filteredItems = new TreeItemProvider<T>();
    const filtered = filterItems(items.value, filter, filterFunc);
    filteredItems.splice(undefined, filteredItems.roots, [
      {
        items: filtered,
      },
    ]);
    return { items, filteredItems, isEmpty: filtered.length === 0 };
  }, [items, filter, filterFunc]);

  const [state, setState] = useState(seed);
  const seededFor = useRef<IReadonlyObservableArray<ITreeItem<T>> | null>(
    items,
  );

  if (state.items !== items) {
    seededFor.current = items;
    setState(seed());
  }

  const filteredItems = state.filteredItems;

  useEffect(() => {
    const onChange = () => {
      const filtered = filterItems(items.value, filter, filterFunc);
      // spliceBatch replaces all roots in a single notification; the plain
      // splice removes each existing root one by one, and every removal
      // notifies the tree into a full synchronous re-render — with hundreds of
      // rows that turned each filter keystroke into seconds of layout work.
      filteredItems.spliceBatch([
        {
          parentItem: undefined,
          itemsToRemove: filteredItems.roots,
          itemsToAdd: [{ items: filtered }],
        },
      ]);
      setState((prev) => ({ ...prev, isEmpty: filtered.length === 0 }));
    };

    // The render-time seed already covers the state this effect run was
    // scheduled for; recompute only when the effect re-runs for other reasons.
    if (seededFor.current === items) {
      seededFor.current = null;
    } else {
      onChange();
    }

    items.subscribe(onChange);
    filter.subscribe(onChange, FILTER_CHANGE_EVENT);

    return () => {
      items.unsubscribe(onChange);
      filter.unsubscribe(onChange, FILTER_CHANGE_EVENT);
    };
  }, [items, filter, filterFunc, filteredItems]);

  return { filteredItems, isEmpty: state.isEmpty };
}
