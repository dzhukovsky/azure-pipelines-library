export type MatrixView = {
  id: string;
  name: string;
  groupIds: number[];
  // Grouping patterns, one per line in the dialog, tried in order; each
  // {...} capture adds one subfolder level (see features/matrix-views/lib).
  groupingPatterns?: string[];
};
