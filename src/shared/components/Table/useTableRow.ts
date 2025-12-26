import type { IFocusWithinStatus } from 'azure-devops-ui/FocusWithin';
import type { IMouseWithinStatus } from 'azure-devops-ui/MouseWithin';
import { createContext, useContext } from 'react';

export type TableRowContextValue = IMouseWithinStatus & IFocusWithinStatus;

export const TableRowContext = createContext<TableRowContextValue | undefined>(
  undefined,
);

export const useTableRow = (): TableRowContextValue => {
  const ctx = useContext(TableRowContext);
  if (!ctx) {
    throw new Error(
      'useTableRow must be used inside <TableRowContext.Provider>',
    );
  }
  return ctx;
};
