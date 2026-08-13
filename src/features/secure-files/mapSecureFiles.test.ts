import { describe, expect, test } from 'bun:test';
import type { SecureFile } from 'azure-devops-extension-api/TaskAgent';
import { mapSecureFiles } from './mapSecureFiles';

const file = (over: Partial<SecureFile> = {}): SecureFile =>
  ({
    id: 'f1',
    name: 'cert.pfx',
    properties: {},
    ...over,
  }) as SecureFile;

describe('mapSecureFiles', () => {
  test('maps id, name and identity/date fields', () => {
    const modifiedOn = new Date('2021-02-02');
    const modifiedBy = { id: 'u1', displayName: 'Bob' };

    const [model] = mapSecureFiles([
      file({ id: 'f9', name: 'key.pem', modifiedBy, modifiedOn } as Partial<SecureFile>),
    ]);

    expect(model.id).toBe('f9');
    expect(model.name.value).toBe('key.pem');
    expect(model.modifiedOn).toBe(modifiedOn);
    expect(model.modifiedBy).toBe(modifiedBy);
  });

  test('maps each property, and tolerates missing properties', () => {
    const [withProps] = mapSecureFiles([
      file({ properties: { env: 'prod', region: 'eu' } } as unknown as SecureFile),
    ]);
    expect(withProps.properties.value).toHaveLength(2);

    const [withoutProps] = mapSecureFiles([
      file({ properties: undefined } as unknown as SecureFile),
    ]);
    expect(withoutProps.properties.value).toHaveLength(0);
  });

  test('falls back to createdBy/createdOn when modified* is absent', () => {
    const createdOn = new Date('2020-06-06');
    const createdBy = { id: 'c1', displayName: 'Creator' };

    const [model] = mapSecureFiles([
      file({ createdBy, createdOn } as Partial<SecureFile>),
    ]);

    expect(model.modifiedOn).toBe(createdOn);
    expect(model.modifiedBy).toBe(createdBy);
  });
});
