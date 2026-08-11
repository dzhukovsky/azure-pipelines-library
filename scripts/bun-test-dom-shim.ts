// `bun test` runs in a plain JS runtime, not a browser. Pure-logic modules under
// `src/shared/components/*` are colocated with their React components in a single
// barrel file (e.g. StateIcon/index.tsx), so importing just the pure exports (like
// `States`) still pulls in `azure-devops-ui`, which reads `window`/`document` and
// touches browser APIs (event listeners, requestAnimationFrame, ...) at module-load
// time. Registering a real (lightweight) DOM keeps those imports side-effect-safe
// for tests that never actually render anything.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();
