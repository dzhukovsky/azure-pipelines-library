import {
  CommonServiceIds,
  type ILocationService,
} from 'azure-devops-extension-api';
import { CoreRestClient } from 'azure-devops-extension-api/Core';
import * as SDK from 'azure-devops-extension-sdk';

let isLoaded = false;
let organizationUrl: string | undefined;
let projectName: string | undefined;

export const initConfigurations = async () => {
  await SDK.ready();
  const service = await SDK.getService<ILocationService>(
    CommonServiceIds.LocationService,
  );

  organizationUrl = await service.getResourceAreaLocation(
    CoreRestClient.RESOURCE_AREA_ID,
  );
  projectName = SDK.getWebContext().project.name;
  isLoaded = true;
};

export const getProjectUrl = () => {
  if (!isLoaded) {
    throw new Error('Configurations are not loaded yet');
  }

  return `${organizationUrl}${projectName}`;
};
