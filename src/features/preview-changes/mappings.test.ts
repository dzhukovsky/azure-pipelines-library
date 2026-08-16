import { describe, expect, test } from 'bun:test';
import type { VariableChange } from '@/features/library-editing';
import { States } from '@/shared/components/StateIcon';
import { variableDisplayName } from './mappings';

const change = (overrides: Partial<VariableChange>): VariableChange => ({
  key: 'app.logging.level',
  valueChanged: false,
  isSecret: false,
  isSecretChanged: false,
  state: States.Modified,
  ...overrides,
});

describe('variableDisplayName', () => {
  test('shows "previous → current" when the variable was renamed', () => {
    expect(
      variableDisplayName(
        change({ previousKey: 'app.log.level', key: 'app.logging.level' }),
      ),
    ).toBe('app.log.level → app.logging.level');
  });

  test('shows just the name when the variable was not renamed', () => {
    expect(variableDisplayName(change({ key: 'app.db.host' }))).toBe(
      'app.db.host',
    );
  });

  test('shows just the name when previousKey repeats the current name', () => {
    expect(
      variableDisplayName(
        change({ previousKey: 'app.db.host', key: 'app.db.host' }),
      ),
    ).toBe('app.db.host');
  });

  test('shows just the name for added and deleted variables', () => {
    expect(
      variableDisplayName(change({ key: 'app.new', state: States.New })),
    ).toBe('app.new');
    expect(
      variableDisplayName(
        change({
          previousKey: 'app.old',
          key: 'app.gone',
          state: States.Deleted,
        }),
      ),
    ).toBe('app.gone');
  });
});
