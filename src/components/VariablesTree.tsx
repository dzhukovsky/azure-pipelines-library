import {
  DocumentKeyRegular,
  KeyRegular,
  LibraryFilled,
} from '@fluentui/react-icons/fonts';
import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { Card } from 'azure-devops-ui/Card';
import {
  type IObservableValue,
  ObservableLike,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { renderListCell } from 'azure-devops-ui/List';
import { MenuButton } from 'azure-devops-ui/Menu';
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
  ITreeItemEx,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import { useCallback, useMemo } from 'react';
import { stringify as yamlStringify } from 'yaml';
import { downloadFile, expandObject } from '@/helpers/exportHelper';
import type { FilterFunc } from '@/hooks/filtering';
import { useIdentityDetailsProvider } from '@/hooks/query/identityImage';
import { getVariableGroupById } from '@/hooks/query/variableGroups';
import { useFiltering } from '@/hooks/treeFiltering';
import { createActionColumn } from './shared/Table/createActionColumn';
import { useRowRenderer } from './shared/Table/useRowRenderer';
import { createExpandableActionColumn } from './shared/Tree/createExpandableActionColumn';
import { renderTextFieldCell, type Status } from './TextFieldTableCell';

export type VariablesTreeProps = {
  items: ITreeItem<LibraryItem>[];
  filter: IFilter;
};

export type GroupItem = {
  id: number;
  name: string;
  status?: IObservableValue<Status>;
  modifiedBy: IdentityRef;
  modifiedOn: Date;
  type: 'group';
};

export type GroupVariableItem = {
  name: IObservableValue<string>;
  value: IObservableValue<string>;
  isSecret: boolean;
  status?: IObservableValue<Status>;
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

export type LibraryItem =
  | GroupItem
  | GroupVariableItem
  | SecureFileItem
  | SecureFilePropertyItem;

const useColumns = () => {
  const getIdentityDetailsProvider = useIdentityDetailsProvider();

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
        renderCell: (item) => {
          return (
            (item.type === 'group' &&
              renderListCell({
                text: item.name,
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
              })) ||
            (item.type === 'groupVariable' &&
              renderTextFieldCell(
                item.name,
                undefined,
                {
                  render: item.isSecret
                    ? (className) => (
                        <KeyRegular
                          className={className}
                          style={{ paddingLeft: '2px', marginLeft: '0' }}
                        />
                      )
                    : undefined,
                  iconName: item.isSecret ? undefined : 'Variable',
                  style: { paddingLeft: '0', marginLeft: '0' },
                },
                { readOnly: true },
              )) ||
            (item.type === 'file' &&
              renderListCell({
                text: item.name,
                textClassName: 'padding-vertical-8',
                iconProps: {
                  render: (className) => (
                    <DocumentKeyRegular className={className} />
                  ),
                },
              })) ||
            undefined
          );
        },
        renderActions: () => <></>,
        // TODO: implement in next releases
        // renderActions: (_rowIndex, item, hasFocus, hasMouse) =>
        //   (item.type === 'group' && hasMouse && (
        //     <Button
        //       subtle
        //       iconProps={{ iconName: 'Add' }}
        //       onClick={(e) => {
        //         console.log('Click');
        //         e.preventDefault();
        //       }}
        //     />
        //   )) ||
        //   (((item.type === 'groupVariable' && hasMouse) || hasFocus) && (
        //     <Button
        //       subtle
        //       iconProps={{ iconName: 'Delete' }}
        //       onClick={(e) => {
        //         console.log('Click');
        //         e.preventDefault();
        //       }}
        //     />
        //   )),
        width: new ObservableValue(-25),
      }),
      createActionColumn<ITreeItemEx<LibraryItem>>({
        id: 'value',
        name: 'Value / Last modified by',
        width: new ObservableValue(-75),
        renderCell: ({ item }) => {
          const underlyingItem = item.underlyingItem;
          const data = ObservableLike.getValue(underlyingItem.data);

          return (
            ((data.type === 'group' || data.type === 'file') && (
              <span
                className="flex-row margin-left-4 flex-center flex-grow"
                style={{ lineHeight: '18px', paddingLeft: '7px' }}
              >
                <VssPersona
                  identityDetailsProvider={getIdentityDetailsProvider(
                    data.modifiedBy,
                  )}
                  className="margin-right-4"
                  size="extra-small"
                />
                <span>{`${data.modifiedBy.displayName} updated ${ago(data.modifiedOn)}`}</span>
              </span>
            )) ||
            (data.type === 'groupVariable' &&
              renderTextFieldCell(data.value, undefined, undefined, {
                readOnly: true,
              })) || <div className="flex-row flex-grow" />
          );
        },
        renderActions: ({ item, hasMouse, hasFocus }) => {
          const underlyingItem = item.underlyingItem;
          const data = ObservableLike.getValue(underlyingItem.data);

          const getExportVariables = async () => {
            if (data.type !== 'group') {
              return {};
            }

            const group = await getVariableGroupById(data.id);
            const varibles = Object.fromEntries(
              Object.entries(group.variables).map(([name, variable]) => [
                name,
                variable.value,
              ]),
            );

            return expandObject(varibles);
          };

          return (
            ((hasMouse || hasFocus) && data.type === 'group' && (
              <MenuButton
                subtle
                hideDropdownIcon
                iconProps={{
                  iconName: 'MoreVertical',
                }}
                contextualMenuProps={() => ({
                  menuProps: {
                    id: 'group-menu',
                    items: [
                      {
                        id: 'download-json',
                        text: 'Download as JSON',
                        onActivate: () => {
                          getExportVariables().then((variables) => {
                            const jsonText = JSON.stringify(variables, null, 2);
                            downloadFile(
                              jsonText,
                              `${data.name}.json`,
                              'application/json',
                            );
                          });

                          return false;
                        },
                      },
                      {
                        id: 'download-yaml',
                        text: 'Download as YAML',
                        onActivate: () => {
                          getExportVariables().then((variables) => {
                            const yamlText = yamlStringify(variables);
                            downloadFile(
                              yamlText,
                              `${data.name}.yaml`,
                              'application/yaml',
                            );
                          });

                          return false;
                        },
                      },
                    ],
                  },
                })}
              />
            )) ||
            undefined
          );
        },
        // || renderStatus(item.underlyingItem.data.status),
      }),
    ];

    return columns;
  }, [getIdentityDetailsProvider]);

  const renderRow = useCallback<TreeRowRenderer<LibraryItem>>(
    (rowIndex, item, details) => {
      const data = ObservableLike.getValue(item.underlyingItem.data);
      const className =
        data.type === 'groupVariable' ? 'text-field-row' : undefined;

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

  if (item.type === 'group') {
    return item.name?.toLocaleLowerCase().includes(filterText);
  }

  if (item.type === 'groupVariable') {
    return (
      item.name.value?.toLocaleLowerCase().includes(filterText) ||
      item.value.value?.toLocaleLowerCase().includes(filterText)
    );
  }

  if (item.type === 'file') {
    return item.name?.toLocaleLowerCase().includes(filterText);
  }

  if (item.type === 'fileProperty') {
    return (
      item.name?.toLocaleLowerCase().includes(filterText) ||
      item.value?.toLocaleLowerCase().includes(filterText)
    );
  }

  return false;
};

export const VariablesTree = ({ items, filter }: VariablesTreeProps) => {
  const { filteredItems, isEmpty } = useFiltering(items, filter, filterFunc);
  const { columns } = useColumns();

  const renderRow = useRowRenderer(columns);

  return (
    (isEmpty && <span>No items found</span>) || (
      <Card
        className="flex-grow bolt-card-no-vertical-padding"
        contentProps={{ contentPadding: false }}
      >
        <Tree<LibraryItem>
          className="text-field-table-wrap"
          columns={columns}
          itemProvider={filteredItems}
          showLines={false}
          renderRow={renderRow}
          onToggle={(_, item) => {
            filteredItems.toggle(item.underlyingItem);
          }}
        />
      </Card>
    )
  );
};
