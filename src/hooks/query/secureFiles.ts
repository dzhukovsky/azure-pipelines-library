import { useQuery } from '@tanstack/react-query';
import { getClient } from 'azure-devops-extension-api';
import { TaskAgentRestClient } from 'azure-devops-extension-api/TaskAgent';
import * as SDK from 'azure-devops-extension-sdk';

export const useSecureFiles = () =>
  useQuery({
    queryKey: ['secure-files'],
    queryFn: async () => {
      await SDK.ready();

      const project = SDK.getWebContext().project;
      const client = getClient(TaskAgentRestClient);
      const secureFiles = await client.getSecureFiles(project.id);

      return secureFiles.sort((a, b) => a.name.localeCompare(b.name));
    },
  });
