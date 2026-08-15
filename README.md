# <img src="logo.svg" width="28" alt="Advanced Library logo"> Advanced Library for Azure DevOps

An Azure DevOps extension that adds a power-user **Library** hub to Azure Pipelines: spreadsheet-style inline editing of variable groups, matrix views for comparing environments side by side, a change preview before anything is saved, and a per-project change history.

![Home tab with variable groups expanded for inline editing](images/home-overview.png)

See [overview.md](overview.md) for the full feature tour (this file doubles as the Marketplace listing).

## Highlights

- **Inline editing** — add, rename, delete and restore variables across all groups on one screen; toggle secrets; per-field New/Modified/Deleted indicators; validation inside the cell.
- **Matrix views** — custom tabs showing a variable-by-group matrix; spot missing values (`NULL` cells), rename a variable across every group at once, organize variables into folders with grouping patterns, compare a row across groups in a side panel.
- **Safe saves** — edits are staged locally; the Preview changes dialog shows the full change set; saving is per group and conflict-aware (groups modified outside your session are skipped with a clear error, the rest still save).
- **Change history** — every save through the extension is recorded per project (who, when, which variables, what kind of change); external changes are surfaced as explicit markers. Values are never stored.
- **Export** — download a variable group as JSON or YAML with dot-notation names expanded into nested objects.
- **Secure files** — listed read-only next to variable groups, including their properties.

## Development

Prerequisites: [Bun](https://bun.sh) ≥ 1.3, Node.js ≥ 21.

```sh
bun install       # install dependencies
bun run dev       # dev server on http://localhost:3000
bun test          # run tests
bun run lint      # biome lint
bun run build     # type-check and build to dist/
```

### Packaging

```sh
bun run package       # production .vsix (vss-extension.json)
bun run package:dev   # dev .vsix (advanced-library-dev) whose hub loads http://localhost:3000
```

The dev package ([vss-extension.dev.json](vss-extension.dev.json) overrides) publishes a separate private extension, `advanced-library-dev`, with an extra "Advanced Library (Dev)" hub pointing at the local dev server — install it in a test organization, run `bun run dev`, and iterate without repackaging.

## Project Structure

The code under `src/` follows a feature-oriented layout:

- **`app/`** — application entry point, providers and top-level routing.
- **`features/`** — self-contained features (variable groups, matrix views, library changes, preview changes, save, history, secure files), each owning its own models, hooks, API access and components.
- **`pages/`** — the hub's pages and tabs (Library with Home/Matrix tabs, History, Settings).
- **`shared/`** — cross-cutting code: the observable model primitives, reusable tree/table/cell components, Azure DevOps API clients, hooks and styles.

## License

[MIT](LICENSE)
