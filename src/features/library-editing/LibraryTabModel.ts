import type { ObservableObject } from '@/shared/lib/observable';
import type { LibraryChanges } from './types';

/**
 * The editing surface a tab exposes to the page header: what to watch for
 * pending edits, how to validate it and how to turn it into a change set.
 *
 * Tabs register the current model on mount and on every internal rebuild, and
 * unregister (`undefined`) on unmount, so the header never holds a model that
 * is no longer on screen.
 */
export type LibraryTabModel = {
  /** Subscribe target; its `modified` flag drives the header commands. */
  observable: ObservableObject<unknown>;
  /** Writes Error states onto the model objects; returns true when valid. */
  validate: () => boolean;
  getChanges: () => LibraryChanges;
  /** Expands or collapses every folder at once. Only tabs that group their
   * rows into folders (matrix views) offer it. */
  setAllExpanded?: (expanded: boolean) => void;
};
