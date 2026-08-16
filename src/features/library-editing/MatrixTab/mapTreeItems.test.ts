import { describe, expect, test } from 'bun:test';
import { ObservableMatrixVariable } from '@/features/variable-groups/models';
import {
  collectFolderPaths,
  findTreeItem,
  mapTreeItems,
} from './mapTreeItems';

const GROUPS = [10];
const APP = ['_app.{}:*'];
const APP_SECRETS = ['_app.{}.{secret:Secrets}:*', '_app.{}:*'];

const variable = (name: string) =>
  new ObservableMatrixVariable(name, {}, GROUPS);

describe('mapTreeItems', () => {
  test('without grouping patterns builds the flat list unchanged', () => {
    const items = mapTreeItems(
      [variable('a'), variable('b')],
      undefined,
      new Set(),
    );

    expect(items.map((x) => x.data.type)).toEqual(['variable', 'variable']);
  });

  test('builds folders first, ungrouped variables after', () => {
    const items = mapTreeItems(
      [
        variable('GlobalTimeout'),
        variable('_app.billing:Conn'),
        variable('_app.orders:Url'),
      ],
      APP,
      new Set(),
    );

    expect(items.map((x) => x.data.type)).toEqual([
      'folder',
      'folder',
      'variable',
    ]);
    expect(items[0].data.data).toMatchObject({
      folderName: 'billing',
      folderPath: 'billing',
    });
    expect(items[0].childItems).toHaveLength(1);
    expect(items[0].expanded).toBe(false); // collapsed by default
  });

  test('a mapped condition builds a subfolder before the parent folder variables', () => {
    const items = mapTreeItems(
      [variable('_app.billing:Conn'), variable('_app.billing.secret:Api')],
      APP_SECRETS,
      new Set(),
    );

    expect(items).toHaveLength(1);
    const children = items[0].childItems ?? [];
    expect(children.map((x) => x.data.type)).toEqual(['folder', 'variable']);
    expect(children[0].data.data).toMatchObject({
      folderName: 'Secrets',
      folderPath: 'billing/secrets',
    });
    expect(children[0].childItems).toHaveLength(1);
    expect(children[0].expanded).toBe(false); // collapsed by default
  });

  test('keeps an explicitly expanded folder expanded across rebuilds', () => {
    const items = mapTreeItems(
      [variable('_app.billing:Conn')],
      APP,
      new Set(['billing']),
    );

    expect(items[0].expanded).toBe(true);
  });

  test('expands a nested folder while its parent stays collapsed by default', () => {
    const items = mapTreeItems(
      [variable('_app.billing:Conn'), variable('_app.billing.secret:Api')],
      APP_SECRETS,
      new Set(['billing/secrets']),
    );

    expect(items[0].expanded).toBe(false);
    expect((items[0].childItems ?? [])[0].expanded).toBe(true);
  });
});

describe('collectFolderPaths', () => {
  test('collects every folder path, nested ones included', () => {
    const items = mapTreeItems(
      [
        variable('_app.billing:Conn'),
        variable('_app.billing.secret:Api'),
        variable('_app.orders:Url'),
        variable('GlobalTimeout'),
      ],
      APP_SECRETS,
      new Set(),
    );

    expect(collectFolderPaths(items)).toEqual([
      'billing',
      'billing/secrets',
      'orders',
    ]);
  });

  test('is empty for a tree without folders', () => {
    const items = mapTreeItems([variable('a'), variable('b')], undefined, new Set());

    expect(collectFolderPaths(items)).toEqual([]);
  });
});

describe('findTreeItem', () => {
  test('finds items at any depth by data reference', () => {
    const items = mapTreeItems(
      [variable('_app.billing:Conn'), variable('_app.billing.secret:Api')],
      APP_SECRETS,
      new Set(),
    );

    const nested = (items[0].childItems ?? [])[0];
    expect(findTreeItem(items, nested.data)).toBe(nested);
    expect(findTreeItem(items, items[0].data)).toBe(items[0]);
  });
});
