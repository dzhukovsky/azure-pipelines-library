import { afterEach, describe, expect, test } from 'bun:test';
import { selectTreeRowInput } from './selectTreeRowInput';

const containers: HTMLElement[] = [];

// Mirrors what useRowRenderer actually renders: <tr data-row-index={index}
// className="bolt-table-row bolt-list-row"> with one input per editable cell.
const createTreeDom = () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <table><tbody>
      <tr data-row-index="0" class="bolt-table-row bolt-list-row first-row">
        <td><input id="row0-name" /></td><td><input id="row0-value" /></td>
      </tr>
      <tr data-row-index="1" class="bolt-table-row bolt-list-row">
        <td><input id="row1-name" /></td><td><input id="row1-value" /></td>
      </tr>
    </tbody></table>
  `;
  document.body.appendChild(container);
  containers.push(container);
  return container;
};

afterEach(() => {
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

describe('selectTreeRowInput', () => {
  test('focuses the first input of the row with the given index', () => {
    const container = createTreeDom();

    selectTreeRowInput(container, 1);

    expect(document.activeElement?.id).toBe('row1-name');
  });

  test('does nothing for a negative index', () => {
    const container = createTreeDom();

    selectTreeRowInput(container, -1);

    expect(document.activeElement?.id).not.toBe('row0-name');
    expect(document.activeElement?.id).not.toBe('row1-name');
  });

  test('does nothing when the row does not exist', () => {
    const container = createTreeDom();

    selectTreeRowInput(container, 5);

    expect(document.activeElement?.id).not.toBe('row0-name');
  });

  test('does nothing for a null container', () => {
    selectTreeRowInput(null, 0);
  });
});
