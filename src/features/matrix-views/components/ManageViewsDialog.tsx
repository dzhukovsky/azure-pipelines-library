import './ManageViewsDialog.scss';

import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { Button } from 'azure-devops-ui/Button';
import { CustomDialog } from 'azure-devops-ui/Dialog';
import { TitleSize } from 'azure-devops-ui/Header';
import { PanelFooter, PanelHeader } from 'azure-devops-ui/Panel';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { TagPicker } from 'azure-devops-ui/TagPicker';
import { TextField } from 'azure-devops-ui/TextField';
import { useEffect, useState } from 'react';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { useMatrixViews, useSaveMatrixViews } from '../hooks/useMatrixViews';
import type { MatrixView } from '../models';

export interface IManageViewsDialogProps {
  onDismiss: () => void;
}

export const ManageViewsDialog = ({ onDismiss }: IManageViewsDialogProps) => {
  const views = useMatrixViews();
  const groups = useVariableGroups();
  const saveViews = useSaveMatrixViews();

  const [draft, setDraft] = useState<MatrixView[]>();

  useEffect(() => {
    if (views.data && !draft) {
      setDraft(views.data);
    }
  }, [views.data, draft]);

  const isLoading = !draft || groups.isLoading;
  const canSave =
    !isLoading &&
    !saveViews.isPending &&
    draft.every((view) => view.name.trim().length > 0);

  const onSave = () => {
    if (!draft) {
      return;
    }

    saveViews.mutate(
      draft.map((view) => ({ ...view, name: view.name.trim() })),
      { onSuccess: onDismiss },
    );
  };

  const addView = () =>
    setDraft((prev) => [
      ...(prev ?? []),
      { id: crypto.randomUUID(), name: '', groupIds: [] },
    ]);

  const updateView = (view: MatrixView) =>
    setDraft((prev) => prev?.map((x) => (x.id === view.id ? view : x)));

  const removeView = (view: MatrixView) =>
    setDraft((prev) => prev?.filter((x) => x.id !== view.id));

  return (
    <CustomDialog
      calloutContentClassName="manage-views-dialog"
      modal={true}
      escDismiss={false}
      lightDismiss={false}
      onDismiss={onDismiss}
    >
      <PanelHeader
        titleProps={{ text: 'Manage views', size: TitleSize.Large }}
        description="Configure custom matrix tabs and the variable groups they include."
        onDismiss={onDismiss}
        showCloseButton={false}
      />
      <div className="manage-views-dialog-content flex-column flex-grow padding-horizontal-16 rhythm-vertical-8">
        {isLoading ? (
          <Spinner size={SpinnerSize.large} className="margin-16" />
        ) : (
          <>
            {draft.length === 0 ? (
              <span className="secondary-text padding-vertical-8">
                No views configured yet. Add a view to create a custom matrix
                tab.
              </span>
            ) : (
              <div className="flex-row rhythm-horizontal-8 secondary-text font-weight-semibold padding-bottom-4">
                <span className="manage-views-dialog-row-name">Tab name</span>
                <span className="manage-views-dialog-row-groups">
                  Variable groups
                </span>
                <span className="manage-views-dialog-row-actions" />
              </div>
            )}
            {draft.map((view) => (
              <ViewRow
                key={view.id}
                view={view}
                groups={groups.data ?? []}
                onChange={updateView}
                onRemove={removeView}
              />
            ))}
            <div className="padding-vertical-8">
              <Button
                text="Add view"
                iconProps={{ iconName: 'Add' }}
                onClick={addView}
              />
            </div>
          </>
        )}
      </div>
      <PanelFooter
        buttonProps={[
          {
            text: 'Cancel',
            onClick: onDismiss,
          },
          {
            text: 'Save',
            onClick: onSave,
            primary: true,
            disabled: !canSave,
          },
        ]}
      />
    </CustomDialog>
  );
};

type ViewRowProps = {
  view: MatrixView;
  groups: VariableGroup[];
  onChange: (view: MatrixView) => void;
  onRemove: (view: MatrixView) => void;
};

const ViewRow = ({ view, groups, onChange, onRemove }: ViewRowProps) => {
  const [searchText, setSearchText] = useState('');

  const selectedTags = view.groupIds.flatMap((groupId) => {
    const group = groups.find((x) => x.id === groupId);
    return group ? [group] : [];
  });

  const suggestions = groups.filter(
    (group) =>
      !view.groupIds.includes(group.id) &&
      group.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="flex-row flex-start rhythm-horizontal-8">
      <TextField
        containerClassName="manage-views-dialog-row-name"
        placeholder="Tab name"
        value={view.name}
        onChange={(_, value) => onChange({ ...view, name: value })}
      />
      <div className="manage-views-dialog-row-groups">
        <TagPicker<VariableGroup>
          ariaLabel="Variable groups"
          noResultsFoundText="No variable groups found"
          placeholderText="Add variable groups"
          areTagsEqual={(first, second) => first.id === second.id}
          convertItemToPill={(group) => ({ content: group.name })}
          renderSuggestionItem={({ item }) => (
            <div className="body-m">{item.name}</div>
          )}
          selectedTags={selectedTags}
          suggestions={suggestions}
          suggestionsLoading={false}
          onSearchChanged={setSearchText}
          onEmptyInputFocus={() => setSearchText('')}
          onTagAdded={(group) => {
            setSearchText('');
            onChange({ ...view, groupIds: [...view.groupIds, group.id] });
          }}
          onTagRemoved={(group) =>
            onChange({
              ...view,
              groupIds: view.groupIds.filter((id) => id !== group.id),
            })
          }
        />
      </div>
      <div className="manage-views-dialog-row-actions">
        <Button
          subtle
          ariaLabel="Remove view"
          iconProps={{ iconName: 'Delete' }}
          onClick={() => onRemove(view)}
        />
      </div>
    </div>
  );
};
