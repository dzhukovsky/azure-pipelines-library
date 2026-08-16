// The repo-root logo.svg is the single source of truth (also used for the
// README and to generate the marketplace icon). It is imported with `?inline`
// so Vite embeds it as a base64 data URI instead of emitting a .svg file:
// the Marketplace rejects extension packages that contain SVG files.
import logoUrl from '../../../logo.svg?inline';

export { logoUrl };
