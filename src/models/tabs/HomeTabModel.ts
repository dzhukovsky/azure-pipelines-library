import type { ObservableSecureFile } from '@/features/secure-files/models';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import {
  ObservableObject,
  type ObservableObjectArray,
} from '@/shared/lib/observable';

export class HomeTabModel extends ObservableObject<HomeTabModel> {
  readonly variableGroups: ObservableObjectArray<ObservableVariableGroup>;
  readonly secureFiles: ObservableObjectArray<ObservableSecureFile>;

  constructor(
    variableGroups: ObservableVariableGroup[],
    secureFiles: ObservableSecureFile[],
  ) {
    super();

    this.variableGroups = this.addArrayProperty(variableGroups);
    this.secureFiles = this.addArrayProperty(secureFiles);
  }
}
