import { IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { Observer } from 'azure-devops-ui/Observer';
import { LastModifiedByCell } from '@/shared/components/LastModifiedByCell';
import { TextFieldCell } from '@/shared/components/TextFieldCell';
import type { HomeTreeRenderer } from '../../HomeTree';
import { NameActions } from './NameActions';
import { ValueActions } from './ValueActions';

const groupIconProps = {
  iconName: 'fluent-LibraryColor',
  size: IconSize.medium,
};

export const groupRenderer: HomeTreeRenderer['group'] = {
  name: {
    renderCell: ({ data }) => (
      <Observer name={data.name} renaming={data.renaming} state={data.state}>
        {({ name, renaming, state }) =>
          renaming ? (
            <TextFieldCell
              value={name}
              state={state}
              iconProps={{
                ...groupIconProps,
                style: { paddingLeft: 0, marginLeft: 0 },
              }}
              placeholder="Name (required)"
              autoFocus
              onChange={(e) => {
                data.name.value = e.target.value;
              }}
              onBlur={() => {
                data.renaming.value = false;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  data.renaming.value = false;
                }
              }}
            />
          ) : (
            renderListCell({
              text: name,
              textClassName: 'padding-vertical-8',
              iconProps: groupIconProps,
            })
          )
        }
      </Observer>
    ),
    renderActions: ({ data, treeItem, rowIndex }) => (
      <NameActions data={data} treeItem={treeItem} rowIndex={rowIndex} />
    ),
  },
  value: {
    renderCell: ({ data }) =>
      data.modifiedBy &&
      data.modifiedOn && (
        <LastModifiedByCell
          modifiedBy={data.modifiedBy}
          modifiedOn={data.modifiedOn}
        />
      ),
    renderActions: ({ data }) => <ValueActions data={data} />,
  },
};
