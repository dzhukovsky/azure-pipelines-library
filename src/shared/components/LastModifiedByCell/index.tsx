import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { ago } from 'azure-devops-ui/Utilities/Date';
import type { IIdentityDetailsProvider } from 'azure-devops-ui/VssPersona';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import { memo } from 'react';
import { getProjectUrl } from '@/shared/api/configurations';

export const LastModifiedByCell = memo(
  (props: { modifiedBy: IdentityRef; modifiedOn: Date }) => {
    return (
      <span
        className="flex-row flex-grow margin-left-4 padding-vertical-8"
        style={{ paddingLeft: '7px' }}
      >
        <span style={{ marginTop: '1px' }}>
          <VssPersona
            identityDetailsProvider={getIdentityDetailsProvider(
              props.modifiedBy,
            )}
            className="margin-right-4"
            size="extra-small"
          />
        </span>
        <span>{`${props.modifiedBy.displayName} updated ${ago(props.modifiedOn)}`}</span>
      </span>
    );
  },
);

const getIdentityDetailsProvider = (
  identity: IdentityRef,
): IIdentityDetailsProvider => {
  const projectUrl = getProjectUrl();

  return {
    getDisplayName: () => identity.displayName,
    getIdentityImageUrl: (size) =>
      `${projectUrl}/_api/_common/IdentityImage?id=${identity.id}&size=${size}`,
  };
};
