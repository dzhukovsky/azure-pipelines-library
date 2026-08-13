/** Focuses and selects the first input (the name cell) of the row rendered
 * with the given `data-row-index`. Used to drop the caret into a freshly
 * inserted row; a negative index (row filtered out / not found) is a no-op. */
export function selectTreeRowInput(
  container: HTMLElement | null,
  rowIndex: number,
): void {
  if (rowIndex < 0) {
    return;
  }

  const input = container
    ?.querySelector(`tr[data-row-index="${rowIndex}"]`)
    ?.querySelector('input');
  input?.focus();
  input?.select();
}
