import {
  type ITreeItemProvider,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';

export function getLoadingProvider<T>(): ITreeItemProvider<T> {
  const provider = new TreeItemProvider<unknown>([{ data: undefined }]);
  return provider as ITreeItemProvider<T>;
}
