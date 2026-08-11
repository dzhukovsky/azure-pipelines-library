import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // RestClientBase is not listed in the package's "exports" map (upstream omission),
      // so the deep import must bypass it; keep in sync with "paths" in tsconfig.app.json
      'azure-devops-extension-api/Common/RestClientBase': path.resolve(
        import.meta.dirname,
        './node_modules/azure-devops-extension-api/esm/Common/RestClientBase.js',
      ),
    },
  },
});
