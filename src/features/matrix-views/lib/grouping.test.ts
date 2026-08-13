import { describe, expect, test } from 'bun:test';
import { getPatternError, groupByPatterns } from './grouping';

const identity = (name: string) => name;

const APP = '_app.{}:*';
const APP_SECRETS = '_app.{}.{secret:Secrets}:*';

describe('groupByPatterns', () => {
  test('captures {} as the folder name; non-matches stay ungrouped', () => {
    const result = groupByPatterns(
      ['_app.billing:Conn', '_app.orders:Url', 'GlobalTimeout'],
      identity,
      [APP],
    );

    expect(result.folders).toEqual([
      {
        name: 'billing',
        path: 'billing',
        folders: [],
        items: ['_app.billing:Conn'],
      },
      {
        name: 'orders',
        path: 'orders',
        folders: [],
        items: ['_app.orders:Url'],
      },
    ]);
    expect(result.ungrouped).toEqual(['GlobalTimeout']);
  });

  test('first matching line wins: specific pattern before the generic one', () => {
    const result = groupByPatterns(
      ['_app.billing:Conn', '_app.billing.secret:Api'],
      identity,
      [APP_SECRETS, APP],
    );

    expect(result.folders).toEqual([
      {
        name: 'billing',
        path: 'billing',
        folders: [
          {
            name: 'Secrets',
            path: 'billing/secrets',
            folders: [],
            items: ['_app.billing.secret:Api'],
          },
        ],
        items: ['_app.billing:Conn'],
      },
    ]);
  });

  test('with the generic pattern first, it claims secret keys too', () => {
    const result = groupByPatterns(['_app.billing.secret:Api'], identity, [
      APP,
      APP_SECRETS,
    ]);

    expect(result.folders.map((f) => f.name)).toEqual(['billing.secret']);
  });

  test('a brace condition that fails makes the whole pattern fail', () => {
    const result = groupByPatterns(['_app.billing.public:Api'], identity, [
      APP_SECRETS,
    ]);

    expect(result.folders).toEqual([]);
    expect(result.ungrouped).toEqual(['_app.billing.public:Api']);
  });

  test('{Word} is shorthand for {Word:Word} — a literal condition, not a catch-all', () => {
    const result = groupByPatterns(
      ['UserInterface.Color', 'Backend.Timeout'],
      identity,
      ['{UserInterface}.*'],
    );

    expect(result.folders).toEqual([
      {
        name: 'UserInterface',
        path: 'userinterface',
        folders: [],
        items: ['UserInterface.Color'],
      },
    ]);
    expect(result.ungrouped).toEqual(['Backend.Timeout']);
  });

  test('{*:Alias} is the explicit catch-all with a fixed folder name', () => {
    const result = groupByPatterns(['_app.billing:X'], identity, [
      '_app.{*:Apps}:*',
    ]);

    expect(result.folders.map((f) => f.name)).toEqual(['Apps']);
  });

  test('conditions may contain wildcards', () => {
    const result = groupByPatterns(
      ['_app.xqwer12ww3:X', '_app.other:Y'],
      identity,
      ['_app.{*qwer*ww*:Secrets}:*'],
    );

    expect(result.folders).toEqual([
      {
        name: 'Secrets',
        path: 'secrets',
        folders: [],
        items: ['_app.xqwer12ww3:X'],
      },
    ]);
    expect(result.ungrouped).toEqual(['_app.other:Y']);
  });

  test('mapping lists resolve to the first matching condition', () => {
    const result = groupByPatterns(
      ['_app.billing.secret:A', '_app.billing.qwe:B'],
      identity,
      ['_app.{}.{secret:Secrets,qwe:Qwe Items}:*'],
    );

    expect(result.folders[0].folders.map((f) => f.name)).toEqual([
      'Qwe Items',
      'Secrets',
    ]);
  });

  test('an empty alias keeps the captured text as the folder name', () => {
    const result = groupByPatterns(['_app.billing.Secret:A'], identity, [
      '_app.{}.{secret:}:*',
    ]);

    expect(result.folders[0].folders.map((f) => f.name)).toEqual(['Secret']);
  });

  test('matches case-insensitively and merges folder casings (first seen wins)', () => {
    const result = groupByPatterns(
      ['_APP.Billing:X', '_app.billing:Y'],
      identity,
      [APP],
    );

    expect(result.folders).toEqual([
      {
        name: 'Billing',
        path: 'billing',
        folders: [],
        items: ['_APP.Billing:X', '_app.billing:Y'],
      },
    ]);
  });

  test('sorts folders alphabetically, keeps item order inside folders', () => {
    const result = groupByPatterns(
      ['_app.zeta:B', '_app.alpha:X', '_app.zeta:A'],
      identity,
      [APP],
    );

    expect(result.folders.map((f) => f.name)).toEqual(['alpha', 'zeta']);
    expect(result.folders[1].items).toEqual(['_app.zeta:B', '_app.zeta:A']);
  });

  test('a match with only empty captures claims nothing; later patterns still apply', () => {
    const result = groupByPatterns(['_app.:X'], identity, [APP, '_app{}:*']);

    expect(result.folders.map((f) => f.name)).toEqual(['.']);
    expect(result.ungrouped).toEqual([]);
  });

  test('an invalid line is skipped, valid lines still apply', () => {
    const result = groupByPatterns(['_app.a:X'], identity, ['{oops', APP]);

    expect(result.folders.map((f) => f.name)).toEqual(['a']);
  });

  test.each([[undefined], [[]]])(
    'no patterns (%p) leaves everything ungrouped',
    (patterns) => {
      const result = groupByPatterns(['a', 'b'], identity, patterns);

      expect(result.folders).toEqual([]);
      expect(result.ungrouped).toEqual(['a', 'b']);
    },
  );
});

describe('getPatternError', () => {
  test.each([APP, APP_SECRETS, '{}', '{*qwer*ww*:Secrets}', '*{a:B,c}*'])(
    'accepts %p',
    (pattern) => {
      expect(getPatternError(pattern)).toBeUndefined();
    },
  );

  test('rejects an unclosed brace', () => {
    expect(getPatternError('_app.{:*')).toContain('{');
  });

  test('rejects a closing brace without an opening one', () => {
    expect(getPatternError('_app.}:*')).toContain('}');
  });

  test('rejects nested braces', () => {
    expect(getPatternError('{a{b}}')).toBeDefined();
  });

  test('rejects a pattern without captures', () => {
    expect(getPatternError('_app.*')).toBeDefined();
  });
});
