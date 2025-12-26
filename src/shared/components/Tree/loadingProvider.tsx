import {
  type ITreeItemProvider,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';

export function getLoadingProvider<T>(): ITreeItemProvider<T> {
  const provider: ITreeItemProvider<unknown> = new TreeItemProvider([
    { data: undefined },
  ]);
  return provider as ITreeItemProvider<T>;
}
