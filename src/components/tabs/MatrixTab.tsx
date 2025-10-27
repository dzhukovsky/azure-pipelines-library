import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useVariableGroups } from '@/hooks/query/variableGroups';
import { VariablesMatrix } from '../VariablesMatrix';

export type MatrixTabProps = {
  filter: IFilter;
};

export const MatrixTab = ({ filter }: MatrixTabProps) => {
  const { data, isLoading, error } = useVariableGroups();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return <VariablesMatrix variableGroups={data ?? []} filter={filter} />;
};
