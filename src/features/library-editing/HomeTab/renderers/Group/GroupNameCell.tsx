import './GroupNameCell.scss';

import { IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { Observer } from 'azure-devops-ui/Observer';
import { useRef } from 'react';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import { TextFieldCell } from '@/shared/components/TextFieldCell';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';

const groupIconProps = {
  iconName: 'fluent-LibraryColor',
  size: IconSize.medium,
};

export const GroupNameCell = ({ data }: { data: ObservableVariableGroup }) => {
  const { onBlur } = useTreeRow();
  const valueBeforeEdit = useRef<string>();

  return (
    <Observer name={data.name} renaming={data.renaming} state={data.state}>
      {({ name, renaming, state }) => {
        if (!renaming) {
          valueBeforeEdit.current = undefined;

          return renderListCell({
            text: name,
            textClassName: 'padding-vertical-8 min-width-0',
            iconProps: groupIconProps,
          });
        }

        valueBeforeEdit.current ??= name;

        const stopEditing = () => {
          data.renaming.value = false;
          // The field took the row's focus with it; hand it back so the row
          // stops looking active and its actions fold away again.
          onBlur?.();
        };

        // Clicking a row toggles the group. While the name is a field, the
        // clicks it receives belong to the caret, not to the tree.
        const keepClickInTheField = (e: React.SyntheticEvent) =>
          e.stopPropagation();

        return (
          <TextFieldCell
            value={name}
            state={state}
            iconProps={{
              ...groupIconProps,
              style: { paddingLeft: 0, marginLeft: 0 },
            }}
            className="group-name-input"
            placeholder="Name (required)"
            autoFocus
            onChange={(e) => {
              data.name.value = e.target.value;
            }}
            onClick={keepClickInTheField}
            onDoubleClick={keepClickInTheField}
            onMouseDown={keepClickInTheField}
            onBlur={stopEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                stopEditing();
              }
              if (e.key === 'Escape') {
                data.name.value = valueBeforeEdit.current ?? name;
                stopEditing();
              }
            }}
          />
        );
      }}
    </Observer>
  );
};
