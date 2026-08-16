import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMatrixViews, saveMatrixViews } from '../api/matrixViewsStorage';
import type { MatrixView } from '../models';

const queryKey = ['matrix-views'];

export const useMatrixViews = () =>
  useQuery({
    queryKey,
    queryFn: getMatrixViews,
  });

export const useSaveMatrixViews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (views: MatrixView[]) => saveMatrixViews(views),
    onSuccess: (views) => {
      queryClient.setQueryData(queryKey, views);
    },
  });
};
