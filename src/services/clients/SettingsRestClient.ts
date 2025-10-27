import { RestClientBase } from 'azure-devops-extension-api/Common/RestClientBase';

export interface Entries<T> {
  count: number;
  value: T;
}

export class SettingsRestClient extends RestClientBase {
  public async getEntries<T>(
    project: string,
    continuationToken?: string,
  ): Promise<Entries<T>> {
    return this.beginRequest<Entries<T>>({
      apiVersion: '7.0',
      routeTemplate: '{project}/_apis/Settings/Entries/globalme',
      routeValues: {
        project: project,
      },
      queryParams: {
        continuationToken: continuationToken,
      },
    });
  }
}
