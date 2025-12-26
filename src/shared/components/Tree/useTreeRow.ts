import type { IFocusWithinStatus } from 'azure-devops-ui/FocusWithin';
import type { IMouseWithinStatus } from 'azure-devops-ui/MouseWithin';
import { createContext, useContext } from 'react';

export type TreeRowContextValue = IMouseWithinStatus & IFocusWithinStatus;

export const TreeRowContext = createContext<TreeRowContextValue | undefined>(
  undefined,
);

export const useTreeRow = (): TreeRowContextValue => {
  const ctx = useContext(TreeRowContext);
  if (!ctx) {
    throw new Error('useTreeRow must be used inside <TreeRowContext.Provider>');
  }
  return ctx;
};
