# azdo-advanced-library

## Editing & History

The Home and Matrix tabs support inline editing of variable groups and their variables directly in the grid — add, edit, rename, delete, and toggle secret status per row or cell, with per-field state indicators (new/modified/deleted) as you go. Edits are staged locally; use "Preview changes" to review a diff of every pending change and see validation errors before committing anything. Saving applies only the groups you changed and is extension-managed: each group's history is appended as an entry keyed by project, independent of the native Azure DevOps Library UI. Before saving, each group is checked against its last-known `modifiedOn` timestamp; if it was modified externally in the meantime, that group's save is skipped with a per-group conflict error while unaffected groups still save, and the resulting history shows an interruption marker so the gap is visible later.

## Project Structure
```
src/
├── app/                                    # 🚀 Application entry point
│   ├── App.tsx
│   ├── main.tsx
│   └── providers.tsx
│
├── features/                               # 🧩 Isolated features
│   ├── preview-changes/
│   │   ├── components/
│   │   │   ├── PreviewChangesDialog.scss
│   │   │   └── PreviewChangesDialog.tsx
│   │   └── mappings.ts
│   │
│   ├── secure-files/
│   │   ├── hooks/
│   │   │   └── useSecureFiles.ts
│   │   └── models/
│   │       ├── index.ts
│   │       ├── ObservableSecureFile.ts
│   │       └── ObservableSecureFileProperty.ts
│   │
│   └── variable-groups/
│       ├── hooks/
│       │   └── useVariableGroups.ts
│       └── models/
│           ├── index.ts
│           ├── ObservableVariable.ts
│           └── ObservableVariableGroup.ts
│
├── pages/                                  # 📄 Pages
│   ├── HistoryPage/
│   ├── LibraryPage/
│   │   ├── HomeTab/
│   │   │   ├── HomeTabModel.ts
│   │   │   └── index.tsx
│   │   ├── MatrixTab/
│   │   └── index.tsx
│   └── SettingsPage/
│
├── shared/                                 # 🔧 Shared code
│   ├── api/
│   │   ├── clients/
│   │   ├── configurations.ts
│   │   └── settingsService.ts
│   │
│   ├── components/
│   │   ├── Table/
│   │   ├── TextFieldCell/
│   │   └── Tree/
│   │
│   ├── hooks/
│   │   ├── useNavigation.ts
│   │   └── useObservable.ts
│   │
│   ├── lib/
│   │   ├── exportHelper.ts
│   │   └── observable/
│   │       ├── index.ts
│   │       ├── ObservableObject.ts
│   │       ├── ObservableObjectArray.ts
│   │       ├── ObservableObjectValue.ts
│   │       └── StateObject.ts
│   │
│   └── styles/
│
└── vite-env.d.ts

```
