import { afterEach, describe, expect, test } from 'bun:test';
import ReactDOM from 'react-dom';
import { States } from '@/shared/components/StateIcon';
import { TextFieldCell } from '.';

const containers: HTMLElement[] = [];

const render = (element: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  ReactDOM.render(element, container);
  return container;
};

afterEach(() => {
  for (const container of containers.splice(0)) {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  }
});

describe('TextFieldCell', () => {
  test('renders an error icon in the prefix slot when state is an error', () => {
    const container = render(
      <TextFieldCell
        value="abc"
        state={States.error('Name is required')}
        readOnly
      />,
    );

    const icon = container.querySelector('.ms-Icon--Error');
    const input = container.querySelector('input');
    expect(icon).not.toBeNull();
    expect(input).not.toBeNull();
    if (!icon || !input) {
      throw new Error('unreachable');
    }

    // The icon must come before the input, in the prefix position.
    expect(
      icon.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test('error icon replaces the prefix icon supplied by the caller', () => {
    const container = render(
      <TextFieldCell
        value="abc"
        state={States.error('Name is required')}
        iconProps={{ iconName: 'fluent-KeyRegular' }}
        readOnly
      />,
    );

    expect(container.querySelector('.ms-Icon--Error')).not.toBeNull();
    expect(container.querySelector('.ms-Icon--fluent-KeyRegular')).toBeNull();
  });

  test('keeps the caller prefix icon and skips the error icon when hideErrorIcon is set', () => {
    const container = render(
      <TextFieldCell
        value="abc"
        state={States.error('Name is required')}
        iconProps={{ iconName: 'fluent-KeyRegular' }}
        hideErrorIcon
        readOnly
      />,
    );

    expect(container.querySelector('.ms-Icon--Error')).toBeNull();
    expect(
      container.querySelector('.ms-Icon--fluent-KeyRegular'),
    ).not.toBeNull();
  });

  test('keeps the caller prefix icon and shows no error icon without an error', () => {
    const container = render(
      <TextFieldCell
        value="abc"
        state={States.Modified}
        iconProps={{ iconName: 'fluent-KeyRegular' }}
        readOnly
      />,
    );

    expect(container.querySelector('.ms-Icon--Error')).toBeNull();
    expect(
      container.querySelector('.ms-Icon--fluent-KeyRegular'),
    ).not.toBeNull();
  });
});
