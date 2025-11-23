import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import type { IIdentityDetailsProvider } from 'azure-devops-ui/VssPersona';
import { getProjectUrl } from './configurations';

export const getIdentityDetailsProvider = (
  identity: IdentityRef,
): IIdentityDetailsProvider => {
  const projectUrl = getProjectUrl();

  return {
    getDisplayName: () => identity.displayName,
    getIdentityImageUrl: (size) =>
      `${projectUrl}/_api/_common/IdentityImage?id=${identity.id}&size=${size}`,
  };
};
