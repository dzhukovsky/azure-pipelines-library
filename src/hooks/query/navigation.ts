import { useQuery } from '@tanstack/react-query';
import {
  CommonServiceIds,
  type IHostNavigationService,
} from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';

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
  isLoading: boolean;
  setQueryParams: QueryParamsSetter<TParams>;
};

export function useNavigationService<TParams extends Record<string, string>>(
  defaultParams: TParams,
): Navigation<TParams> {
  const {
    data: queryParams,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['navigation-service', defaultParams],
    queryFn: async () => {
      const service = await getNavigationService();
      const params = await service.getQueryParams();
      return { ...defaultParams, ...params };
    },
  });

  const setQueryParams = async (
    newParams: Partial<TParams>,
    refetch = true,
  ) => {
    const service = await getNavigationService();
    const currentParams = (await service.getQueryParams()) as TParams;
    const updatedParams = { ...currentParams, ...newParams } as TParams;
    service.setQueryParams(updatedParams);
    refetch && (await refetchQuery());
  };

  return {
    queryParams: queryParams ?? defaultParams,
    isLoading,
    setQueryParams,
  };
}

export const navigateTo = async (url: string) => {
  await SDK.ready();
  const service = await SDK.getService<IHostNavigationService>(
    CommonServiceIds.HostNavigationService,
  );

  service.navigate(url);
};
