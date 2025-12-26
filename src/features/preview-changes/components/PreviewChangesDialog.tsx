import './PreviewChangesDialog.scss';

import {
  type IObservableValue,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { CustomDialog } from 'azure-devops-ui/Dialog';
import { TitleSize } from 'azure-devops-ui/Header';
import { IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { Observer } from 'azure-devops-ui/Observer';
import { PanelFooter, PanelHeader } from 'azure-devops-ui/Panel';
import { type ITreeColumn, Tree } from 'azure-devops-ui/TreeEx';
import {
  type ITreeItemProvider,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useMemo } from 'react';
import type { ObservableSecureFile } from '@/features/secure-files/models';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import { StateIcon } from '@/shared/components/StateIcon';
import { TextFieldCell } from '@/shared/components/TextFieldCell';
import { createActionColumn } from '@/shared/components/Tree/createActionColumn';
import { createExpandableActionColumn } from '@/shared/components/Tree/createExpandableActionColumn';
import type { ObservableObjectArray } from '@/shared/lib/observable';
import {
  type LibraryItem,
  mapSecureFileChanges,
  mapTreeItems,
  mapVariableGroupChanges,
} from '../mappings';

export type PreviewChangesDialogOptions = {
  variableGroups: ObservableObjectArray<ObservableVariableGroup>;
  secureFiles: ObservableObjectArray<ObservableSecureFile>;
};

export interface IPreviewChangesDialogProps {
  options: IObservableValue<PreviewChangesDialogOptions | undefined>;
}

export const PreviewChangesDialog = (props: IPreviewChangesDialogProps) => {
  return (
    <Observer options={props.options}>
      {({ options }) => {
        if (!options) {
          return null;
        }

        const variableGroups = mapVariableGroupChanges(options?.variableGroups);
        const secureFiles = mapSecureFileChanges(options?.secureFiles);

        const treeItems = mapTreeItems(variableGroups, secureFiles);
        const itemProvider = new TreeItemProvider(treeItems);

        const close = () => {
          props.options.value = undefined;
        };

        return (
          <CustomDialog
            calloutContentClassName="preview-changes-dialog"
            modal={true}
            escDismiss={false}
            lightDismiss={false}
            onDismiss={close}
          >
            <PanelHeader
              titleProps={{ text: 'Preview changes', size: TitleSize.Large }}
              onDismiss={close}
              showCloseButton={false}
            />
            <PreviewChangesTree itemProvider={itemProvider} />
            <PanelFooter
              buttonProps={[
                {
                  text: 'Cancel',
                  onClick: close,
                },
                {
                  text: 'Save changes',
                  onClick: close,
                  primary: true,
                },
              ]}
            />
          </CustomDialog>
        );
      }}
    </Observer>
  );
};

const useColumns = () => {
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
              text: group.name,
              textClassName: 'padding-vertical-8',
              iconProps: {
                iconName: 'fluent-LibraryColor',
                size: IconSize.medium,
              },
            });
          }

          const groupVariable = data.groupVariable;
          if (groupVariable) {
            return (
              <TextFieldCell
                value={groupVariable.name}
                state={groupVariable.state}
                iconProps={{
                  iconName: groupVariable.isSecret
                    ? 'fluent-KeyRegular'
                    : 'fluent-MathFormulaRegular',
                  style: {
                    paddingLeft: 0,
                    marginLeft: 0,
                  },
                  size: IconSize.medium,
                }}
                readOnly
              />
            );
          }

          const file = data.file;
          if (file) {
            return renderListCell({
              text: file.name,
              textClassName: 'padding-vertical-8',
              iconProps: {
                iconName: 'fluent-DocumentKeyRegular',
                size: IconSize.medium,
              },
            });
          }

          const fileProperty = data.fileProperty;
          if (fileProperty) {
            return renderListCell({
              text: fileProperty.name,
              textClassName: 'padding-vertical-8',
            });
          }

          return undefined;
        },
        renderActions: () => undefined,
        width: new ObservableValue(-25),
      }),
      createActionColumn<LibraryItem>({
        id: 'value',
        name: 'Value',
        width: new ObservableValue(-75),
        renderCell: ({ data }) => {
          const groupVariable = data.groupVariable;
          if (groupVariable) {
            return (
              <TextFieldCell
                value={groupVariable.value ?? ''}
                state={groupVariable.state}
                type={groupVariable.isSecret ? 'password' : 'text'}
                readOnly
              />
            );
          }

          const fileProperty = data.fileProperty;
          if (fileProperty) {
            return (
              <TextFieldCell
                value={fileProperty.value ?? ''}
                state={fileProperty.state}
                readOnly
              />
            );
          }

          return <span className="flex-row flex-grow" />;
        },
        renderActions: ({ data }) => {
          const groupOrFile = data.group ?? data.file;
          if (groupOrFile) {
            return <StateIcon state={groupOrFile.state} circle />;
          }

          const variableOrProperty = data.groupVariable ?? data.fileProperty;
          if (variableOrProperty) {
            return <StateIcon state={variableOrProperty.state} />;
          }
        },
      }),
    ];

    return columns;
  }, []);

  return { columns };
};

const PreviewChangesTree = ({
  itemProvider,
}: {
  itemProvider: ITreeItemProvider<LibraryItem>;
}) => {
  const { columns } = useColumns();
  return (
    <Tree<LibraryItem>
      id={'variables-tree'}
      className="text-field-table-wrap"
      columns={columns}
      scrollable={true}
      itemProvider={itemProvider}
      showLines={false}
      virtualize={false}
      onToggle={(_, item) => {
        if (item.underlyingItem.childItems?.length) {
          itemProvider.toggle(item.underlyingItem);
        }
      }}
    />
  );
};
