import { useQuery } from '@tanstack/react-query';
import { getClient } from 'azure-devops-extension-api';
import {
  TaskAgentRestClient,
  type VariableGroupParameters,
} from 'azure-devops-extension-api/TaskAgent';
import * as SDK from 'azure-devops-extension-sdk';

export const variableGroupsQueryKey = ['variable-groups'];

/** Shared so the app can prefetch it during init (see App.tsx). */
export const variableGroupsQuery = {
  queryKey: variableGroupsQueryKey,
  queryFn: async () => {
    await SDK.ready();

    const project = SDK.getWebContext().project;
    const client = getClient(TaskAgentRestClient);
    const variableGroups = await client.getVariableGroups(project.id);

    return variableGroups.sort((a, b) => a.name.localeCompare(b.name));
  },
};

export const useVariableGroups = () => useQuery(variableGroupsQuery);

export const getVariableGroupById = async (id: number) => {
  await SDK.ready();

  const project = SDK.getWebContext().project;
  const client = getClient(TaskAgentRestClient);
  const variableGroup = await client.getVariableGroup(project.id, id);

  return variableGroup;
};

export const updateVariableGroupById = async (
  groupId: number,
  parameters: VariableGroupParameters,
) => {
  await SDK.ready();

  const client = getClient(TaskAgentRestClient);
  // Note the v5 client argument order: parameters first, groupId second.
  return client.updateVariableGroup(parameters, groupId);
};
