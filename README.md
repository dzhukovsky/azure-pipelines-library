# azdo-advanced-library

## Project Structure
```
src/
├── app/                          # Application entry point
│   ├── App.tsx                   # Root component (formerly LibraryPage)
│   ├── providers.tsx             # QueryClient, SurfaceContext
│   └── main.tsx                  # SDK initialization, render bootstrap
│
├── features/                     # Feature-based structure
│   ├── variable-groups/          # Feature: Variable Groups
│   │   ├── api/                  # API requests
│   │   │   └── variableGroupsApi.ts
│   │   ├── components/           # Feature UI components
│   │   │   ├── VariableGroupTree.tsx
│   │   │   └── ActionCells/
│   │   ├── hooks/                # Feature hooks
│   │   │   └── useVariableGroups.ts
│   │   ├── models/               # Feature models
│   │   │   ├── ObservableVariableGroup.ts
│   │   │   └── ObservableVariable.ts
│   │   └── index.ts              # Feature public API
│   │
│   ├── secure-files/             # Feature: Secure Files
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── models/
│   │   └── index.ts
│   │
│   ├── preview-changes/          # Feature: Preview Changes dialog
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   │
│   └── matrix/                   # Feature: Matrix tab
│       ├── components/
│       └── index.ts
│
├── shared/                       # Reusable/shared code
│   ├── api/                      # Base API clients
│   │   ├── clients/
│   │   │   └── SettingsRestClient.ts
│   │   └── configurations.ts
│   │
│   ├── components/               # Shared UI components
│   │   ├── Table/
│   │   ├── Tree/
│   │   ├── TextFieldCell.tsx
│   │   └── State.tsx
│   │
│   ├── hooks/                    # Shared hooks
│   │   ├── useFilter.ts
│   │   ├── useSorting.ts
│   │   └── useNavigation.ts
│   │
│   ├── lib/                      # Utilities and observable system
│   │   ├── observable/
│   │   │   ├── ObservableObject.ts
│   │   │   ├── ObservableObjectArray.ts
│   │   │   ├── ObservableObjectValue.ts
│   │   │   └── StateObject.ts
│   │   └── export.ts
│   │
│   └── styles/
│       └── icons.scss
│
├── pages/                        # Pages / tabs (thin components)
│   ├── HomePage/
│   │   ├── HomePage.tsx
│   │   ├── useHomePageModel.ts
│   │   └── index.ts
│   └── MatrixPage/
│       └── ...
│
└── types/                        # Shared types
    └── index.ts
```
