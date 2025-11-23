import { ObservableObject } from '../Observable/ObservableObject';
import type { ObservableObjectArray } from '../Observable/ObservableObjectArray';
import type { ObservableSecureFile } from '../SecureFile';
import type { ObservableVariableGroup } from '../VariableGroup';

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
