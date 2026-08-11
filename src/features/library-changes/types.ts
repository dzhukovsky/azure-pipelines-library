import type { State } from '@/shared/components/StateIcon';

export type VariableChange = {
  key: string; // current name
  previousKey?: string; // set when renamed; save deletes previousKey
  value?: string; // undefined = value untouched (preserve server value, incl. secrets)
  valueChanged: boolean;
  isSecret: boolean;
  isSecretChanged: boolean;
  state: State; // New | Modified | Deleted | Error (never Unchanged)
};

export type GroupChange = {
  groupId: number;
  name: string; // current name
  nameChanged: boolean;
  modifiedOnSnapshot?: Date; // what the model was built from — concurrency check input
  state: State;
  variables: VariableChange[];
};

export type FileChange = {
  fileId: string;
  name: string;
  state: State;
  properties: { name: string; value: string; state: State }[];
};

export type LibraryChanges = { groups: GroupChange[]; files: FileChange[] };

export type HistoryChangeStatus = 'added' | 'modified' | 'deleted' | 'renamed';
export const getChangeStatus = (c: VariableChange): HistoryChangeStatus =>
  c.state.type === 'Deleted'
    ? 'deleted'
    : c.state.type === 'New'
      ? 'added'
      : c.previousKey && c.previousKey !== c.key
        ? 'renamed'
        : 'modified';
