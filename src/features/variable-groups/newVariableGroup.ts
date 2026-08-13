import { getProjectUrl } from '@/shared/api/configurations';
import { navigateTo } from '@/shared/hooks/useNavigation';

/** Opens the native Azure DevOps "new variable group" editor. */
export const goToNewVariableGroup = () =>
  navigateTo(
    `${getProjectUrl()}/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=0`,
  );
