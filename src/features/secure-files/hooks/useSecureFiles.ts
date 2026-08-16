import { useQuery } from '@tanstack/react-query';
import { getClient } from 'azure-devops-extension-api';
import { TaskAgentRestClient } from 'azure-devops-extension-api/TaskAgent';
import * as SDK from 'azure-devops-extension-sdk';

export const secureFilesQueryKey = ['secure-files'];

/** Shared so the app can prefetch it during init (see App.tsx). */
export const secureFilesQuery = {
  queryKey: secureFilesQueryKey,
  queryFn: async () => {
    await SDK.ready();

    const project = SDK.getWebContext().project;
    const client = getClient(TaskAgentRestClient);
    const secureFiles = await client.getSecureFiles(project.id);

    return secureFiles.sort((a, b) => a.name.localeCompare(b.name));
  },
};

export const useSecureFiles = () => useQuery(secureFilesQuery);
