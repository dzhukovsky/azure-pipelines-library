# Advanced Library

**Edit all your variable groups on one screen.** Advanced Library adds a power-user hub to Azure Pipelines: inline spreadsheet-style editing across variable groups, side-by-side matrix views for comparing environments, a change preview before anything is saved, and a per-project history of who changed what.

[![Home tab with variable groups expanded for inline editing](images/home-overview.png)](images/home-overview.png)

## Why

The built-in Library hub edits one variable group at a time, saves every change the moment you make it, and keeps no meaningful record of who changed what. That gets painful as soon as the same set of variables lives in Dev / Test / Prod groups: checking whether one value drifted between environments means opening three groups in three tabs and comparing them by eye.

Advanced Library puts them on one screen. Custom tabs lay any set of groups out as a matrix — one row per variable, one column per environment — so drift is visible at a glance and can be corrected right there in the row. Edits are staged locally until you review the whole change set and save it deliberately, and every save is recorded per project.

## Features

### Inline editing

Edit variable names and values directly in the grid — no per-group drill-down, no modal per variable.

- Add, rename, delete and restore variables; toggle between plain text and secret.
- Rename a variable group itself from its row menu — the new name is staged alongside the variables and saved with them.
- Every edit is staged locally and marked with a state indicator (**N**ew / **M**odified / **D**eleted) until you save or discard.
- Deleted variables stay visible (struck through) and can be restored with one click.
- Validation catches empty and duplicate names — errors are shown right inside the cell.
- Keyword search filters groups and variables by name and value.

[![Inline editing with state indicators](images/inline-editing.png)](images/inline-editing.png)

### Matrix views

Build custom tabs that show a variable-by-group matrix: one row per variable name, one column per variable group. Perfect for keeping environment groups in sync.

- Instantly spot variables that are missing in one environment (`NULL` cells) and add them in place — or delete a value from a single environment without touching the others.
- Switch on **Differences only** to hide every variable that already reads the same in all the groups of the view, leaving just the drift.
- Rename a variable across every group in the view at once.
- Organize hundreds of variables into folders with flexible grouping patterns (wildcards and captures), and expand or collapse them all with one button.
- Toggle the **row comparison** panel to see one variable's value in every group, side by side.

[![Matrix view comparing variable groups across environments](images/matrix-view.png)](images/matrix-view.png)

[![Row comparison panel](images/row-comparison.png)](images/row-comparison.png)

A view is defined once — which groups the tab covers, how variable names collapse into folders — and stored with the project, so the whole team opens the same tabs.

[![Manage views dialog defining matrix tabs and grouping patterns](images/manage-views.png)](images/manage-views.png)

### Preview changes before saving

Nothing is written until you say so. The **Preview changes** dialog shows the complete staged change set — added, modified, deleted and renamed items per group, a rename spelled out as `old name → new name` — with validation errors highlighted.

- Saving is per group and conflict-aware: if someone modified a group outside your session, that group is skipped with a clear error while the rest of your changes still save.
- Secrets stay masked everywhere; untouched values (including secrets) are preserved exactly as they are on the server.

[![Preview changes dialog with the staged change set](images/preview-changes.png)](images/preview-changes.png)

### Change history

Every save made through the extension is recorded per project: who saved, when, which groups, and which variables were added, modified, renamed or deleted. Variable **values are never stored** — only names and change types.

- Changes made outside the extension (native UI, REST API, other tools) show up as explicit *external change* markers, so the timeline never silently lies to you.

[![History of library changes](images/history.png)](images/history.png)

### Export

Download any variable group as **JSON** or **YAML** from its context menu. Dot-separated variable names (`app.logging.level`) are expanded into nested objects, and values are typed (numbers, booleans). Note: secret values are not included — Azure DevOps never returns them.

### Secure files

Secure files and their properties are listed alongside variable groups, read-only, so the Home tab gives a complete picture of your project's library. Uploading a new one — like creating a variable group from scratch — still belongs to the native Library, and the **New** button takes you straight there.

## Getting started

1. Install the extension in your organization.
2. Open **Pipelines → Advanced Library** in any project.

## Data, privacy and permissions

- The extension talks only to Azure DevOps REST APIs — no external services, no telemetry.
- Matrix view definitions and the change history are stored in the Azure DevOps extension data service, inside your own organization, scoped per project. Variable values are never written there.
- Requested scopes:
  - `vso.variablegroups_manage` — read and update variable groups (the only write operation the extension performs).
  - `vso.securefiles_read` — list secure files and their properties.

## Feedback and support

Found a bug or have an idea? Open an issue on [GitHub](https://github.com/dzhukovsky/azdo-advanced-library/issues). The extension is open source under the MIT license.
