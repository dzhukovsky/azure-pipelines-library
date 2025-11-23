import {
  DocumentKeyRegular,
  KeyRegular,
  LibraryFilled,
} from '@fluentui/react-icons/fonts';
import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { Card } from 'azure-devops-ui/Card';
import {
  type IObservableValue,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { renderListCell } from 'azure-devops-ui/List';
import { Observer } from 'azure-devops-ui/Observer';
import {
  type ITreeColumn,
  renderTreeRow,
  Tree,
  type TreeRowRenderer,
} from 'azure-devops-ui/TreeEx';
import { ago } from 'azure-devops-ui/Utilities/Date';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import type {
  ITreeItem,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import { memo, useCallback, useMemo } from 'react';
import type { State } from '@/components/shared/State';
import { createActionColumn } from '@/components/shared/Tree/createActionColumn';
import { createExpandableActionColumn } from '@/components/shared/Tree/createExpandableActionColumn';
import { useRowRenderer } from '@/components/shared/Tree/useRowRenderer';
import { TextFieldCell } from '@/components/TextFieldCell';
import type { FilterFunc } from '@/hooks/filtering';
import { getIdentityDetailsProvider } from '@/hooks/query/identityImage';
import { useFiltering } from '@/hooks/treeFiltering';
import type {
  ObservableSecureFile,
  ObservableSecureFileProperty,
} from '@/models/SecureFile';
import type {
  ObservableVariable,
  ObservableVariableGroup,
} from '@/models/VariableGroup';
import { GroupNameActionsCell } from './actionCells/GroupNameActionsCell';
import { GroupValueActionsCell } from './actionCells/GroupValueActionsCell';
import { VariableNameActionsCell } from './actionCells/VariableNameActionsCell';
import { VariableValueActionsCell } from './actionCells/VariableValueActionsCell';

export type VariablesTreeProps = {
  items: ITreeItem<LibraryItem>[];
  filter: IFilter;
};

export type GroupItem = {
  id: number;
  name: string;
  state: State;
  modifiedBy: IdentityRef;
  modifiedOn: Date;
  type: 'group';
};

export type GroupVariableItem = {
  name: IObservableValue<string>;
  value: IObservableValue<string>;
  isSecret: IObservableValue<boolean>;
  state: IObservableValue<State>;
  type: 'groupVariable';
};

export type SecureFileItem = {
  name: string;
  modifiedBy: IdentityRef;
  modifiedOn: Date;
  type: 'file';
};

export type SecureFilePropertyItem = {
  name: string;
  value: string;
  type: 'fileProperty';
};

export type LibraryItem = {
  group?: ObservableVariableGroup;
  groupVariable?: ObservableVariable;
  file?: ObservableSecureFile;
  fileProperty?: ObservableSecureFileProperty;
};

const useColumns = (itemProvider: ITreeItemProvider<LibraryItem>) => {
  const columns = useMemo(() => {
    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns: ITreeColumn<LibraryItem>[] = [
      createExpandableActionColumn<LibraryItem>({
        id: 'name',
        name: 'Name',
        contentClassName: 'padding-vertical-0 padding-right-0',
        onSize,
        renderCell: ({ data }) => {
          const group = data.group;
          if (group) {
            return renderListCell({
              text: group.name.value,
              textClassName: 'padding-vertical-8',
              iconProps: {
                render: (className) => (
                  <LibraryFilled
                    className={className}
                    style={{
                      color: 'var(--icon-folder-color, #dcb67a)',
                    }}
                  />
                ),
              },
            });
          }

          const groupVariable = data.groupVariable;
          if (groupVariable) {
            return (
              <Observer
                state={groupVariable.state}
                isSecret={groupVariable.isSecret}
              >
                {({ state, isSecret }) => (
                  <TextFieldCell
                    value={groupVariable.name}
                    state={state}
                    iconProps={{
                      render: isSecret
                        ? (className) => (
                            <KeyRegular
                              className={className}
                              style={{ paddingLeft: '2px', marginLeft: '0' }}
                            />
                          )
                        : undefined,
                      iconName: isSecret ? undefined : 'Variable',
                      style: { paddingLeft: '0', marginLeft: '0' },
                    }}
                    textFieldProps={{
                      onChange: (_, newValue) => {
                        groupVariable.name.value = newValue;
                      },
                    }}
                  />
                )}
              </Observer>
            );
          }

          const file = data.file;
          if (file) {
            return renderListCell({
              text: file.name.value,
              textClassName: 'padding-vertical-8',
              iconProps: {
                render: (className) => (
                  <DocumentKeyRegular className={className} />
                ),
              },
            });
          }

          const fileProperty = data.fileProperty;
          if (fileProperty) {
            return renderListCell({
              text: fileProperty.name.value,
              textClassName: 'padding-vertical-8',
              iconProps: {
                render: (className) => (
                  <DocumentKeyRegular className={className} />
                ),
              },
            });
          }

          return undefined;
        },
        renderActions: ({ rowIndex, data, treeItem }) =>
          (data.group && (
            <GroupNameActionsCell
              rowIndex={rowIndex}
              treeItem={treeItem}
              itemProvider={itemProvider}
            />
          )) ||
          (data.groupVariable && (
            <VariableNameActionsCell
              data={data.groupVariable}
              treeItem={treeItem}
              itemProvider={itemProvider}
            />
          )),
        width: new ObservableValue(-25),
      }),
      createActionColumn<LibraryItem>({
        id: 'value',
        name: 'Value / Last modified by',
        width: new ObservableValue(-75),
        renderCell: ({ data }) => {
          const groupOrFile = data.group ?? data.file;
          if (groupOrFile?.modifiedBy && groupOrFile.modifiedOn) {
            return (
              <LastModifiedByCell
                modifiedBy={groupOrFile.modifiedBy}
                modifiedOn={groupOrFile.modifiedOn}
              />
            );
          }

          const groupVariable = data.groupVariable;
          if (groupVariable) {
            return (
              <Observer
                state={groupVariable.state}
                isSecret={groupVariable.isSecret}
              >
                {({ state, isSecret }) => (
                  <TextFieldCell
                    value={groupVariable.value}
                    state={state}
                    textFieldProps={{
                      inputType: isSecret ? 'password' : 'text',
                      onChange: (_, newValue) => {
                        groupVariable.value.value = newValue;
                      },
                    }}
                  />
                )}
              </Observer>
            );
          }
        },
        renderActions: ({ data }) =>
          (data.group && <GroupValueActionsCell data={data.group} />) ||
          (data.groupVariable && (
            <VariableValueActionsCell data={data.groupVariable} />
          )),
      }),
    ];

    return columns;
  }, [itemProvider]);

  const renderRow = useCallback<TreeRowRenderer<LibraryItem>>(
    (rowIndex, item, details) => {
      const data = item.underlyingItem.data;
      const className = data.groupVariable ? 'text-field-row' : undefined;

      return renderTreeRow(rowIndex, item, details, columns, data, className);
    },
    [columns],
  );

  return { columns, renderRow };
};

const filterFunc: FilterFunc<LibraryItem> = (item, filterText) => {
  if (!filterText || !item) {
    return true;
  }

  if (item.group) {
    return item.group.name.value?.toLocaleLowerCase().includes(filterText);
  }

  if (item.groupVariable) {
    return (
      item.groupVariable.name.value?.toLocaleLowerCase().includes(filterText) ||
      item.groupVariable.value.value?.toLocaleLowerCase().includes(filterText)
    );
  }

  if (item.file) {
    return item.file.name.value?.toLocaleLowerCase().includes(filterText);
  }

  if (item.fileProperty) {
    return (
      item.fileProperty.name.value?.toLocaleLowerCase().includes(filterText) ||
      item.fileProperty.value.value?.toLocaleLowerCase().includes(filterText)
    );
  }

  return false;
};

export const VariablesTree = ({ items, filter }: VariablesTreeProps) => {
  const { filteredItems, isEmpty } = useFiltering(items, filter, filterFunc);
  const { columns } = useColumns(filteredItems);

  const renderRow = useRowRenderer(columns);

  return (
    (isEmpty && <span>No items found</span>) || (
      <Card
        className="flex-grow bolt-card-no-vertical-padding"
        contentProps={{ contentPadding: false }}
      >
        <Tree<LibraryItem>
          id={'variables-tree'}
          className="text-field-table-wrap"
          columns={columns}
          itemProvider={filteredItems}
          showLines={false}
          virtualize={false}
          renderRow={renderRow}
          onToggle={(_, item) => {
            if (item.underlyingItem.childItems?.length) {
              filteredItems.toggle(item.underlyingItem);
            }
          }}
        />
      </Card>
    )
  );
};

const LastModifiedByCell = memo(
  (props: { modifiedBy: IdentityRef; modifiedOn: Date }) => {
    return (
      <span
        className="flex-row flex-grow margin-left-4 padding-vertical-8"
        style={{ paddingLeft: '7px' }}
      >
        <span style={{ marginTop: '1px' }}>
          <VssPersona
            identityDetailsProvider={getIdentityDetailsProvider(
              props.modifiedBy,
            )}
            className="margin-right-4"
            size="extra-small"
          />
        </span>
        <span>{`${props.modifiedBy.displayName} updated ${ago(props.modifiedOn)}`}</span>
      </span>
    );
  },
);
