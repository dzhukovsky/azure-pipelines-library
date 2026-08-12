import { useQuery } from '@tanstack/react-query';
import { getHistoryEntries } from '../api/historyStorage';

export const historyQueryKey = ['library-history'];

export const useHistory = () =>
  useQuery({ queryKey: historyQueryKey, queryFn: getHistoryEntries });
