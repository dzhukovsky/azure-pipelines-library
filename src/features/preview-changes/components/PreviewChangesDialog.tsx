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

        const clearOptions = () => {
          props.options.value = undefined;
        };

        return (
          <PreviewChangesDialogContent
            options={options}
            clearOptions={clearOptions}
          />
        );
      }}
    </Observer>
  );
};

// A separate component (rather than inline in the Observer render prop)
// because it needs hooks and local state: the render prop body above runs
// on every Observable notification and cannot hold its own state. This also
// gives the "every fresh dialog opening starts clean" property for free —
// closing the dialog sets `options` back to undefined, which unmounts this
// component and discards saving/errors/reloadOnClose with it; reopening
// mounts a brand-new instance with fresh useState defaults.
//
// All three dismiss paths (Close/Cancel button, the dialog's onDismiss, the
// header's onDismiss) funnel through the same onClose so a pending reload
// can never be bypassed by one of them changing independently.
const PreviewChangesDialogContent = ({
  options,
  clearOptions,
}: {
  options: PreviewChangesDialogOptions;
  clearOptions: () => void;
}) => {
  const itemProvider = useMemo(
    () => new TreeItemProvider(mapTreeItems(options.changes)),
    [options.changes],
  );
  const invalid = hasErrors(options.changes);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<GroupSaveResult[]>();
  const [generalError, setGeneralError] = useState<string>();
  // Set (and kept set — see onSaveClick) once any save attempt saved at
  // least one group. From then on the pre-save `options.changes` snapshot
  // is stale: resubmitting it would hit already-saved groups with a
  // misleading conflict error, or, for matrix groups without a
  // modifiedOnSnapshot, silently re-apply a rename onto already-renamed
  // data. So once true, Save is disabled and the user must close (which
  // triggers the deferred reload) before doing anything else.
  const [reloadOnClose, setReloadOnClose] = useState(false);

  const onClose = () => {
    clearOptions();
    if (reloadOnClose) {
      options.onClosed?.();
    }
  };

  const onSaveClick = async () => {
    setSaving(true);
    setErrors(undefined);
    setGeneralError(undefined);
    try {
      const outcome = await options.onSave();
      if (outcome.ok) {
        clearOptions();
      } else {
        setErrors(outcome.results.filter((r) => !r.ok));
        setReloadOnClose((prev) => prev || outcome.results.some((r) => r.ok));
      }
      options.onSaved(outcome); // page invalidates/remounts on full success
    } catch (e) {
      // saveLibraryChanges is documented to never throw; this only guards
      // against an unexpected bug so the modal — no esc/light-dismiss, no
      // close button — can never get stuck showing nothing.
      setGeneralError(
        `Unexpected error while saving: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  // After any save attempt that produced errors (or saved partially), the
  // dialog can no longer just be cancelled back to a clean slate — reads
  // better as "Close" than "Cancel" from here on.
  const closeText =
    errors || generalError || reloadOnClose ? 'Close' : 'Cancel';

  return (
    <CustomDialog
      calloutContentClassName="preview-changes-dialog"
      modal={true}
      escDismiss={false}
      lightDismiss={false}
      onDismiss={onClose}
    >
      <PanelHeader
        titleProps={{ text: 'Preview changes', size: TitleSize.Large }}
        onDismiss={onClose}
        showCloseButton={false}
      />
      {invalid && (
        <MessageCard
          severity={MessageCardSeverity.Warning}
          className="margin-16"
        >
          Fix the highlighted errors before saving.
        </MessageCard>
      )}
      <PreviewChangesTree itemProvider={itemProvider} />
      {(errors || generalError) && (
        <MessageCard severity={MessageCardSeverity.Error} className="margin-16">
          {generalError && <div>{generalError}</div>}
          {errors?.map((r) => (
            <div key={r.groupId}>
              {r.groupName}: {r.ok ? '' : r.error}
            </div>
          ))}
        </MessageCard>
      )}
      {reloadOnClose && (
        <MessageCard severity={MessageCardSeverity.Info} className="margin-16">
          Successfully saved groups were applied; press Close to reload.
        </MessageCard>
      )}
      <PanelFooter
        buttonProps={[
          { text: closeText, onClick: onClose, disabled: saving },
          {
            text: saving ? 'Saving…' : 'Save changes',
            onClick: onSaveClick,
            primary: true,
            disabled: invalid || saving || reloadOnClose,
          },
        ]}
      />
    </CustomDialog>
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
              text: group.previousName
                ? `${group.previousName} → ${group.name}`
                : group.name,
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
