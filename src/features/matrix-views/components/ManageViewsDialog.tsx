import './ManageViewsDialog.scss';

import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { Button } from 'azure-devops-ui/Button';
import { CustomDialog } from 'azure-devops-ui/Dialog';
import { FormItem } from 'azure-devops-ui/FormItem';
import { TitleSize } from 'azure-devops-ui/Header';
import { Icon, IconSize } from 'azure-devops-ui/Icon';
import { PanelFooter, PanelHeader } from 'azure-devops-ui/Panel';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { TagPicker } from 'azure-devops-ui/TagPicker';
import { TextField } from 'azure-devops-ui/TextField';
import { useEffect, useState } from 'react';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { useMatrixViews, useSaveMatrixViews } from '../hooks/useMatrixViews';
import { getPatternError } from '../lib/grouping';
import type { MatrixView } from '../models';

export interface IManageViewsDialogProps {
  onDismiss: () => void;
}

// First problem across the non-blank lines, as "Line N: message".
const getGroupingPatternsError = (
  patterns: string[] | undefined,
): string | undefined => {
  for (const [index, line] of (patterns ?? []).entries()) {
    const pattern = line.trim();
    const error = pattern ? getPatternError(pattern) : undefined;
    if (error) {
      return `Line ${index + 1}: ${error}`;
    }
  }

  return undefined;
};

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
    draft.every(
      (view) =>
        view.name.trim().length > 0 &&
        !getGroupingPatternsError(view.groupingPatterns),
    );

  const onSave = () => {
    if (!draft) {
      return;
    }

    saveViews.mutate(
      draft.map((view) => {
        const groupingPatterns = (view.groupingPatterns ?? [])
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        return {
          ...view,
          name: view.name.trim(),
          groupingPatterns: groupingPatterns.length
            ? groupingPatterns
            : undefined,
        };
      }),
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
            {draft.length === 0 && (
              <span className="secondary-text padding-vertical-8">
                No views configured yet. Add a view to create a custom matrix
                tab.
              </span>
            )}
            {draft.map((view) => (
              <ViewSection
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

const patternExamples: [string, string][] = [
  ['_app.{}:*', 'folder named by the captured text'],
  ['_app.{}.{secret:Secrets}:*', 'nested "Secrets" folder for .secret keys'],
  ['{Secrets}', 'same as {*:Secrets} — any text, fixed folder name'],
  ['{secret:Secrets,qwe:Qwe Items}', 'condition:alias list, first match wins'],
  ['{*qwer*ww*:Secrets}', 'conditions may use * wildcards'],
];

// Rendered inside the tooltip, an inverted surface — every color must be
// inherited from it, not taken from page palette classes like secondary-text.
const GroupingPatternsHelp = () => (
  <div className="manage-views-dialog-pattern-help flex-column rhythm-vertical-8 padding-8">
    <span>
      One pattern per line; lines are tried top to bottom and the first match
      wins. A pattern must cover the whole variable name — use * for "anything
      here". Each {'{...}'} capture adds one subfolder level.
    </span>
    {patternExamples.map(([pattern, description]) => (
      <div key={pattern} className="flex-column">
        <code>{pattern}</code>
        <span>{description}</span>
      </div>
    ))}
  </div>
);

const groupingPatternsLabel = (
  <span className="flex-row flex-center">
    Grouping patterns
    <Icon
      iconName="Info"
      size={IconSize.small}
      className="margin-left-4 secondary-text"
      tooltipProps={{ renderContent: () => <GroupingPatternsHelp /> }}
    />
  </span>
);

type ViewSectionProps = {
  view: MatrixView;
  groups: VariableGroup[];
  onChange: (view: MatrixView) => void;
  onRemove: (view: MatrixView) => void;
};

const ViewSection = ({ view, groups, onChange, onRemove }: ViewSectionProps) => {
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

  const patternsError = getGroupingPatternsError(view.groupingPatterns);

  return (
    <div className="manage-views-dialog-section flex-column rhythm-vertical-8">
      <div className="flex-row flex-end rhythm-horizontal-8">
        <FormItem label="Tab name" className="flex-grow">
          <TextField
            placeholder="Tab name"
            value={view.name}
            onChange={(_, value) => onChange({ ...view, name: value })}
          />
        </FormItem>
        <Button
          subtle
          ariaLabel="Remove view"
          iconProps={{ iconName: 'Delete' }}
          onClick={() => onRemove(view)}
        />
      </div>
      <FormItem label="Variable groups">
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
      </FormItem>
      <FormItem
        label={groupingPatternsLabel}
        error={!!patternsError}
        message={
          patternsError ??
          'Optional; one pattern per line, first matching line wins. Leave empty for a flat list.'
        }
      >
        <TextField
          containerClassName="manage-views-dialog-grouping-key"
          multiline
          rows={2}
          autoAdjustHeight
          placeholder="e.g. _app.{}:*"
          value={view.groupingPatterns?.join('\n') ?? ''}
          onChange={(_, value) =>
            onChange({
              ...view,
              groupingPatterns: value ? value.split('\n') : undefined,
            })
          }
        />
      </FormItem>
    </div>
  );
};
