import { createContext, useContext } from 'react';

export interface TableRowContextValue {
  hasFocus: boolean;
  hasMouse: boolean;
}

export const TableRowContext = createContext<TableRowContextValue | undefined>(
  undefined,
);

export function useTableRow(): TableRowContextValue {
  const ctx = useContext(TableRowContext);
  if (!ctx) {
    throw new Error(
      'useTableRow must be used inside <TableRowContext.Provider>',
    );
  }
  return ctx;
}
