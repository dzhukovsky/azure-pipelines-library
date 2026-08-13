import { Filter } from 'azure-devops-ui/Utilities/Filter';
import { useCallback, useEffect, useMemo } from 'react';
import { useFilterSubscription } from '@/shared/components/Tree/useFiltering';
import type { QueryParamsSetter } from '@/shared/hooks/useNavigation';

export const useFilter = (
  defaultValue: string,
  setQueryParams: QueryParamsSetter<{ filter: string }>,
) => {
  const filter = useMemo(
    () => new Filter({ defaultState: { keyword: { value: defaultValue } } }),
    [defaultValue],
  );

  useEffect(() => {
    if (filter.getFilterItemValue('keyword') !== defaultValue) {
      filter.setFilterItemState('keyword', { value: defaultValue });
    }
  }, [defaultValue, filter]);

  const onFilterChange = useCallback(() => {
    setQueryParams(
      { filter: filter.getFilterItemValue('keyword') ?? '' },
      false,
    );
  }, [filter, setQueryParams]);

  useFilterSubscription(filter, onFilterChange);

  return filter;
};
