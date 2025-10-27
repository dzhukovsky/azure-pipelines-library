import {
  CommonServiceIds,
  type ILocationService,
} from 'azure-devops-extension-api';
import { CoreRestClient } from 'azure-devops-extension-api/Core';
import * as SDK from 'azure-devops-extension-sdk';

let organizationUrl: string | undefined;

export const loadConfigurations = async () => {
  await SDK.ready();
  const service = await SDK.getService<ILocationService>(
    CommonServiceIds.LocationService,
  );

  organizationUrl = await service.getResourceAreaLocation(
    CoreRestClient.RESOURCE_AREA_ID,
  );
};

export const getOrganizationUrl = () => {
  if (!organizationUrl) {
    throw new Error(
      'Organization URL is not loaded yet. Make sure to call loadConfigurations() before using this function.',
    );
  }
  return organizationUrl;
};

export const getProjectUrl = () => {
  if (!organizationUrl) {
    throw new Error(
      'Organization URL is not loaded yet. Make sure to call loadConfigurations() before using this function.',
    );
  }
  return `${organizationUrl}${SDK.getWebContext().project.name}`;
};
