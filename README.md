# azdo-advanced-library

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
│   │   │   ├── ActionCells/
│   │   │   ├── HomeTabModel.ts
│   │   │   ├── index.tsx
│   │   │   └── VariablesTree.tsx
│   │   ├── MatrixTab/
│   │   │   ├── MatrixTab.tsx
│   │   │   └── VariablesMatrix.tsx
│   │   ├── index.scss
│   │   └── index.tsx
│   └── SettingsPage/
│
├── shared/                                 # 🔧 Shared code
│   ├── api/
│   │   ├── clients/
│   │   ├── configurations.ts
│   │   ├── identityImage.ts
│   │   └── settingsService.ts
│   │
│   ├── components/
│   │   ├── State/
│   │   ├── Table/
│   │   ├── TextFieldCell/
│   │   └── Tree/
│   │
│   ├── hooks/
│   │   ├── useNavigation.ts
│   │   ├── useObservable.ts
│   │   └── useTabModel.ts
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
