import type { IReadonlyObservableValue } from 'azure-devops-ui/Core/Observable';
import type { IItemProvider } from 'azure-devops-ui/Utilities/Provider';
import type { ITreeItemEx } from 'azure-devops-ui/Utilities/TreeItemProvider';

/**
 * The exact shape azure-devops-ui's `Tree` wants for `itemProvider`. Its own
 * `TreeItemProvider` does not satisfy it under `strictFunctionTypes` (a library
 * type inconsistency), so the provider is cast to this at the call site.
 */
export type TreeItemProviderProp<T> = IItemProvider<
  ITreeItemEx<T> | IReadonlyObservableValue<ITreeItemEx<T>>
>;
