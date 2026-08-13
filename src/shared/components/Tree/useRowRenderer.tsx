import { FocusOrMouseWithin } from 'azure-devops-ui/FocusOrMouseWithin';
import type { IFocusWithinStatus } from 'azure-devops-ui/FocusWithin';
import type { IMouseWithinStatus } from 'azure-devops-ui/MouseWithin';
import { renderColumns } from 'azure-devops-ui/Table';
import type { ITreeColumn, TreeRowRenderer } from 'azure-devops-ui/TreeEx';
import { css, getSafeIdWithSymbolConversion } from 'azure-devops-ui/Util';
import type { ITreeItemEx } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useCallback, useEffect } from 'react';
import { SpacerColumn } from './SpacerColumn';
import { TreeRowContext } from './useTreeRow';

export type RowFocusChangeHandler<T> = (
  item: ITreeItemEx<T>,
  hasFocus: boolean,
) => void;

// Renders nothing; reports row focus transitions from an effect. The blur
// notification comes from the effect cleanup, so it also fires when a focused
// row unmounts (filtering, rebuild) — the consumer never keeps a stale row.
function RowFocusNotifier<T>({
  item,
  hasFocus,
  onFocusChange,
}: {
  item: ITreeItemEx<T>;
  hasFocus: boolean;
  onFocusChange: RowFocusChangeHandler<T>;
}) {
  useEffect(() => {
    if (hasFocus) {
      onFocusChange(item, true);
      return () => onFocusChange(item, false);
    }
  }, [hasFocus, item, onFocusChange]);

  return null;
}

export function useRowRenderer<T>(
  columns: ITreeColumn<T>[],
  onRowFocusChange?: RowFocusChangeHandler<T>,
) {
  const renderRow = useCallback<TreeRowRenderer<T>>(
    (index, item, details) => {
      return (
        <FocusOrMouseWithin key={index}>
          {(props: IMouseWithinStatus & IFocusWithinStatus) => (
            <tr
              id={getSafeIdWithSymbolConversion(details.id)}
              data-row-index={index}
              onBlur={props.onBlur}
              onFocus={props.onFocus}
              onMouseEnter={props.onMouseEnter}
              onMouseLeave={props.onMouseLeave}
              className={css(
                details.className,
                'bolt-table-row bolt-list-row',
                index === 0 && 'first-row',
                props.hasFocus && 'focused',
              )}
            >
              {onRowFocusChange && (
                <RowFocusNotifier
                  item={item}
                  hasFocus={props.hasFocus}
                  onFocusChange={onRowFocusChange}
                />
              )}
              <SpacerColumn key="left-spacer" />
              <TreeRowContext.Provider value={props}>
                {renderColumns(index, columns, item, details)}
              </TreeRowContext.Provider>
              <SpacerColumn key="right-spacer" />
            </tr>
          )}
        </FocusOrMouseWithin>
      );
    },
    [columns, onRowFocusChange],
  );

  return renderRow;
}
