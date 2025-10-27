import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import * as SDK from 'azure-devops-extension-sdk';
import type { IIdentityDetailsProvider } from 'azure-devops-ui/VssPersona';
import { useCallback } from 'react';
import { getOrganizationUrl } from './configurations';

export const useIdentityDetailsProvider = () => {
  const organizationUrl = getOrganizationUrl();
  const project = SDK.getWebContext().project;

  return useCallback(
    (identity: IdentityRef): IIdentityDetailsProvider => ({
      getDisplayName: () => identity.displayName,
      getIdentityImageUrl: (size) =>
        `${organizationUrl}${project.id}/_api/_common/IdentityImage?id=${identity.id}&size=${size}`,
    }),
    [organizationUrl, project],
  );
};
