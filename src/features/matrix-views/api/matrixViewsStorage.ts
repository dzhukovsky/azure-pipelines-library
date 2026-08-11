import {
  CommonServiceIds,
  type IExtensionDataService,
} from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';
import type { MatrixView } from '../models';

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

const getViewsKey = () => `matrix-views-${SDK.getWebContext().project.id}`;

export const getMatrixViews = async (): Promise<MatrixView[]> => {
  const dataManager = await getDataManager();
  const views = await dataManager.getValue<MatrixView[]>(getViewsKey(), {
    defaultValue: [],
  });

  return views ?? [];
};

export const saveMatrixViews = async (
  views: MatrixView[],
): Promise<MatrixView[]> => {
  const dataManager = await getDataManager();
  return dataManager.setValue(getViewsKey(), views);
};
