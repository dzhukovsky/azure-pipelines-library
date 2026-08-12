import {
  CommonServiceIds,
  type IExtensionDataService,
} from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';
import type { HistoryEntry } from '../models';

export const MAX_HISTORY_ENTRIES = 500;

const getDataManager = async () => {
  await SDK.ready();

  const dataService = await SDK.getService<IExtensionDataService>(
    CommonServiceIds.ExtensionDataService,
  );
  const accessToken = await SDK.getAccessToken();

  return dataService.getExtensionDataManager(
    SDK.getExtensionContext().id,
    accessToken,
  );
};

const getHistoryKey = () => `library-history-${SDK.getWebContext().project.id}`;

export const getHistoryEntries = async (): Promise<HistoryEntry[]> => {
  const dataManager = await getDataManager();
  const entries = await dataManager.getValue<HistoryEntry[]>(getHistoryKey(), {
    defaultValue: [],
  });

  return entries ?? [];
};

export const appendHistoryEntries = async (
  entries: HistoryEntry[],
): Promise<HistoryEntry[]> => {
  const dataManager = await getDataManager();
  const existing = await getHistoryEntries();
  // Newest first; prune the tail so the document stays small (keys only).
  const merged = [...entries, ...existing].slice(0, MAX_HISTORY_ENTRIES);

  return dataManager.setValue(getHistoryKey(), merged);
};
