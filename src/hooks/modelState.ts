import { createContext, useContext } from 'react';

type SaveHandler = () => Promise<void> | void;

type ModelState = {
  hasChanges: boolean;
  onSave: SaveHandler;
};

const ModelStateContext = createContext<{
  models: Record<string, ModelState>;
  setModel: (id: string, state: ModelState) => void;
  saveAll: () => Promise<void>;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
} | null>(null);

export const useModelState = () => {
  const ctx = useContext(ModelStateContext);
  if (!ctx)
    throw new Error('useModelState must be used within ModelStateProvider');
  return ctx;
};

export const useTabModel = (
  id: string,
  hasChanges: boolean,
  onSave: SaveHandler,
) => {
  const { setModel } = useModelState();
  setModel(id, { hasChanges, onSave });
};
