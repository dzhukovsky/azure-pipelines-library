import { useQuery } from '@tanstack/react-query';
import {
  CommonServiceIds,
  type IHostNavigationService,
} from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';
import { useCallback } from 'react';

const getNavigationService = async () => {
  await SDK.ready();
  const service = await SDK.getService<IHostNavigationService>(
    CommonServiceIds.HostNavigationService,
  );
  return service;
};

export type QueryParamsSetter<TParams> = (
  newParams: Partial<TParams>,
  refetch?: boolean,
) => Promise<void>;

export type Navigation<TParams extends Record<string, string>> = {
  queryParams: TParams;
  route?: string;
  isLoading: boolean;
  setQueryParams: QueryParamsSetter<TParams>;
};

export function useNavigation<TParams extends Record<string, string>>(
  defaultParams: TParams,
): Navigation<TParams> {
  const {
    data,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['navigation-service', defaultParams],
    queryFn: async () => {
      const service = await getNavigationService();
      const params = await service.getQueryParams();
      const route = await service.getPageRoute();

      return {
        queryParams: { ...defaultParams, ...params },
        route: normalizePath(route.routeValues.parameters ?? ''),
      };
    },
  });

  const setQueryParams = useCallback(
    async (newParams: Partial<TParams>, refetch = true) => {
      const service = await getNavigationService();
      const currentParams = (await service.getQueryParams()) as TParams;
      const updatedParams = { ...currentParams, ...newParams } as TParams;
      service.setQueryParams(updatedParams);
      refetch && (await refetchQuery());
    },
    [refetchQuery],
  );

  return {
    queryParams: data?.queryParams ?? defaultParams,
    route: data?.route,
    isLoading,
    setQueryParams,
  };
}

export const navigateTo = async (url: string) => {
  const service = await getNavigationService();
  service.navigate(url);
};

function normalizePath(value: string) {
  const idx = value.indexOf('/');
  value = idx === -1 ? '' : value.slice(idx + 1).trim();
  return value.toLowerCase();
}
