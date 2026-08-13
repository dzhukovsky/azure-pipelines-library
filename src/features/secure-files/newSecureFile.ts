import { getProjectUrl } from '@/shared/api/configurations';
import { navigateTo } from '@/shared/hooks/useNavigation';

/** Opens the native Azure DevOps secure files page. */
export const goToNewSecureFile = () => {
  navigateTo(`${getProjectUrl()}/_library?itemType=SecureFiles`);
};
