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

type DataManager = Awaited<ReturnType<typeof getDataManager>>;

const readEntries = async (dataManager: DataManager): Promise<HistoryEntry[]> => {
  const entries = await dataManager.getValue<HistoryEntry[]>(getHistoryKey(), {
    defaultValue: [],
  });

  return entries ?? [];
};

export const getHistoryEntries = async (): Promise<HistoryEntry[]> => {
  const dataManager = await getDataManager();

  return readEntries(dataManager);
};

/**
 * Reads the history, hands it to `addEntries` newest-first, and writes the
 * returned entries back in front of it. Callers that need to look at what is
 * already recorded — to tell an external change from one of our own saves —
 * get it without a second round trip.
 */
export const appendHistoryEntries = async (
  addEntries: (existing: HistoryEntry[]) => HistoryEntry[],
): Promise<HistoryEntry[]> => {
  const dataManager = await getDataManager();
  const existing = await readEntries(dataManager);
  const added = addEntries(existing);

  if (!added.length) {
    return existing;
  }

  // Newest first; prune the tail so the document stays small (keys only).
  const merged = [...added, ...existing].slice(0, MAX_HISTORY_ENTRIES);

  return dataManager.setValue(getHistoryKey(), merged);
};
