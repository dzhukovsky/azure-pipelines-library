import type { SecureFile } from 'azure-devops-extension-api/TaskAgent';
import {
  ObservableSecureFile,
  ObservableSecureFileProperty,
} from '@/features/secure-files/models';

export const mapSecureFiles = (secureFiles: SecureFile[]) => {
  return secureFiles.map((file) => {
    const properties = Object.entries(file.properties ?? {}).map(
      ([name, value]) => {
        return new ObservableSecureFileProperty(name, value, false);
      },
    );
    return new ObservableSecureFile(
      file.id,
      file.name,
      properties,
      false,
      file.modifiedBy ?? file.createdBy,
      file.modifiedOn ?? file.createdOn,
    );
  });
};
