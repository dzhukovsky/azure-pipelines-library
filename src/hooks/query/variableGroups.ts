import { useQuery } from '@tanstack/react-query';
import { getClient } from 'azure-devops-extension-api';
import { TaskAgentRestClient } from 'azure-devops-extension-api/TaskAgent';
import * as SDK from 'azure-devops-extension-sdk';

export const useVariableGroups = () =>
  useQuery({
    queryKey: ['variable-groups'],
    queryFn: async () => {
      await SDK.ready();

      const project = SDK.getWebContext().project;
      const client = getClient(TaskAgentRestClient);
      const variableGroups = await client.getVariableGroups(project.id);

      return variableGroups.sort((a, b) => a.name.localeCompare(b.name));
    },
  });

export const getVariableGroupById = async (id: number) => {
  await SDK.ready();

  const project = SDK.getWebContext().project;
  const client = getClient(TaskAgentRestClient);
  const variableGroup = await client.getVariableGroup(project.id, id);

  return variableGroup;
};
