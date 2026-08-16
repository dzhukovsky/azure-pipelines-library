import { afterEach, describe, expect, test } from 'bun:test';
import ReactDOM from 'react-dom';
import { StateIcon, States } from '.';

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

describe('StateIcon', () => {
  test('renders an error icon for an error state', () => {
    const container = render(
      <StateIcon state={States.error('Name is required')} />,
    );

    expect(container.querySelector('.ms-Icon--Error')).not.toBeNull();
  });

  test('renders nothing for an error state when hideError is set', () => {
    const container = render(
      <StateIcon state={States.error('Name is required')} hideError />,
    );

    expect(container.querySelector('.ms-Icon--Error')).toBeNull();
  });

  test('still renders non-error states when hideError is set', () => {
    const container = render(<StateIcon state={States.Modified} hideError />);

    expect(container.textContent).toBe('M');
  });
});
