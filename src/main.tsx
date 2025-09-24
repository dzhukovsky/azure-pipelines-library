import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
if (!root) throw new Error('Failed to find the root element');

createRoot(root).render(
  <StrictMode>
    <div>Hello, World!</div>
  </StrictMode>,
);
