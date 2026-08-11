import './PreviewChangesDialog.scss';

import {
  type IObservableValue,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { CustomDialog } from 'azure-devops-ui/Dialog';
import { TitleSize } from 'azure-devops-ui/Header';
import { IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { MessageCard, MessageCardSeverity } from 'azure-devops-ui/MessageCard';
import { Observer } from 'azure-devops-ui/Observer';
import { PanelFooter, PanelHeader } from 'azure-devops-ui/Panel';
import { type ITreeColumn, Tree } from 'azure-devops-ui/TreeEx';
import {
  type ITreeItemProvider,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useMemo, useState } from 'react';
import { hasErrors, type LibraryChanges } from '@/features/library-changes';
import type {
  GroupSaveResult,
  SaveOutcome,
} from '@/features/save-changes/saveLibraryChanges';
import { StateIcon } from '@/shared/components/StateIcon';
import { TextFieldCell } from '@/shared/components/TextFieldCell';
import { createActionColumn } from '@/shared/components/Tree/createActionColumn';
import { createExpandableActionColumn } from '@/shared/components/Tree/createExpandableActionColumn';
import { type LibraryItem, mapTreeItems } from '../mappings';

export type PreviewChangesDialogOptions = {
  changes: LibraryChanges;
  onSave: () => Promise<SaveOutcome>;
  onSaved: (outcome: SaveOutcome) => void; // page-level: invalidate + remount + record history
  // Invoked when the dialog is dismissed after a partial save (some groups
  // saved, some failed). Lets the page defer its reload until the user has
  // had a chance to read the per-group errors, instead of yanking the
  // dialog away the instant the save call returns.
  onClosed?: () => void;
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

        const itemProvider = new TreeItemProvider(
          mapTreeItems(options.changes),
        );

        const invalid = hasErrors(options.changes);

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
            {invalid && (
              <MessageCard severity={MessageCardSeverity.Warning}>
                Fix the highlighted errors before saving.
              </MessageCard>
            )}
            <PreviewChangesTree itemProvider={itemProvider} />
            <SaveFooter options={options} invalid={invalid} close={close} />
          </CustomDialog>
        );
      }}
    </Observer>
  );
};

// A separate component (rather than inline in the Observer render prop)
// because it needs hooks: the render prop body above runs on every
// Observable notification and cannot hold its own state.
const SaveFooter = ({
  options,
  invalid,
  close,
}: {
  options: PreviewChangesDialogOptions;
  invalid: boolean;
  close: () => void;
}) => {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<GroupSaveResult[]>();
  // Set when the failed save still saved some groups: the data is now
  // stale, but the dialog stays open so the errors remain visible. The
  // reload (via options.onClosed) is deferred until the user dismisses it.
  const [reloadOnClose, setReloadOnClose] = useState(false);

  const onSaveClick = async () => {
    setSaving(true);
    setErrors(undefined);
    const outcome = await options.onSave();
    setSaving(false);
    if (outcome.ok) {
      close();
    } else {
      setErrors(outcome.results.filter((r) => !r.ok));
      setReloadOnClose(outcome.results.some((r) => r.ok));
    }
    options.onSaved(outcome); // page invalidates/remounts on full success
  };

  const onCancelClick = () => {
    close();
    if (reloadOnClose) {
      options.onClosed?.();
    }
  };

  return (
    <>
      {errors && (
        <>
          <MessageCard
            severity={MessageCardSeverity.Error}
            className="margin-16"
          >
            {errors.map((r) => `${r.groupName}: ${r.ok ? '' : r.error}`).join('\n')}
          </MessageCard>
          {reloadOnClose && (
            <MessageCard
              severity={MessageCardSeverity.Info}
              className="margin-16"
            >
              Successfully saved groups were applied; press Cancel to reload.
            </MessageCard>
          )}
        </>
      )}
      <PanelFooter
        buttonProps={[
          { text: 'Cancel', onClick: onCancelClick, disabled: saving },
          {
            text: saving ? 'Saving…' : 'Save changes',
            onClick: onSaveClick,
            primary: true,
            disabled: invalid || saving,
          },
        ]}
      />
    </>
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
                value={groupVariable.key}
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
