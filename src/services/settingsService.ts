import { getClient } from 'azure-devops-extension-api';
import * as SDK from 'azure-devops-extension-sdk';
import { SettingsRestClient } from './clients/SettingsRestClient';

export const getCurrentTheme = async () => {
  await SDK.ready();

  const project = SDK.getWebContext().project;
  const environmentsClient = getClient(SettingsRestClient);
  const entries = await environmentsClient.getEntries<{
    'WebPlatform/Theme': string;
  }>(project.name);

  return entries.value['WebPlatform/Theme'];
};
