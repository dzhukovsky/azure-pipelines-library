import './HistoryContent.scss';

import { useQueryClient } from '@tanstack/react-query';
import { Ago } from 'azure-devops-ui/Ago';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import { Icon, IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { Pill, PillSize } from 'azure-devops-ui/Pill';
import { PillGroup, PillGroupOverflow } from 'azure-devops-ui/PillGroup';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { type ITreeColumn, Tree } from 'azure-devops-ui/TreeEx';
import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import {
  type ITreeItemProvider,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { IIdentityDetailsProvider } from 'azure-devops-ui/VssPersona';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import { useEffect, useMemo } from 'react';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { getProjectUrl } from '@/shared/api/configurations';
import { StateIcon, States } from '@/shared/components/StateIcon';
import { createActionColumn } from '@/shared/components/Tree/createActionColumn';
import { createExpandableActionColumn } from '@/shared/components/Tree/createExpandableActionColumn';
import {
  buildSaveEvents,
  type ExternalItem,
  type HistoryListItem,
  type SaveEventItem,
} from '../buildSaveEvents';
import { buildTimeline } from '../buildTimeline';
import { historyQueryKey, useHistory } from '../hooks/useHistory';
import type { HistoryEntry, HistoryEntryChange } from '../models';

const statusState = {
  added: States.New,
  modified: States.Modified,
  deleted: States.Deleted,
  renamed: States.Modified,
} as const;

const changeText = (c: HistoryEntryChange) =>
  c.status === 'renamed' ? `${c.key} → ${c.renamedTo}` : c.key;

const getActorIdentityDetailsProvider = (
  actor: HistoryEntry['actor'],
): IIdentityDetailsProvider => {
  const projectUrl = getProjectUrl();

  return {
    getDisplayName: () => actor.displayName,
    getIdentityImageUrl: (size) =>
      `${projectUrl}/_api/_common/IdentityImage?id=${actor.id}&size=${size}`,
  };
};

// Same optional-field row shape the Preview changes tree uses.
type HistoryTreeItem = {
  save?: SaveEventItem;
  group?: HistoryEntry;
  change?: HistoryEntryChange;
  external?: ExternalItem;
};

const mapTreeItems = (
  items: HistoryListItem[],
): ITreeItem<HistoryTreeItem>[] =>
  items.map<ITreeItem<HistoryTreeItem>>((item) =>
    item.kind === 'external'
      ? { data: { external: item } }
      : {
          data: { save: item },
          expanded: false,
          childItems: item.entries.map<ITreeItem<HistoryTreeItem>>(
            (entry) => ({
              data: { group: entry },
              // Groups come pre-expanded so opening a save event shows the
              // changed variables right away.
              expanded: true,
              childItems: entry.changes.map<ITreeItem<HistoryTreeItem>>(
                (change) => ({ data: { change } }),
              ),
            }),
          ),
        },
  );

const useColumns = () => {
  const columns = useMemo(() => {
    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns: ITreeColumn<HistoryTreeItem>[] = [
      createExpandableActionColumn<HistoryTreeItem>({
        id: 'change',
        name: 'Change',
        contentClassName: 'padding-vertical-0 padding-right-0',
        onSize,
        renderCell: ({ data }) => {
          const save = data.save;
          if (save) {
            return (
              <div className="flex-row flex-center rhythm-horizontal-8 padding-vertical-8">
                <VssPersona
                  identityDetailsProvider={getActorIdentityDetailsProvider(
                    save.actor,
                  )}
                  size="extra-small"
                />
                <span>{save.actor.displayName}</span>
                <span className="secondary-text">
                  <Ago date={new Date(save.timestamp)} />
                </span>
              </div>
            );
          }

          const group = data.group;
          if (group) {
            return renderListCell({
              text: group.groupName,
              textClassName: 'padding-vertical-8',
              iconProps: {
                iconName: 'fluent-LibraryColor',
                size: IconSize.medium,
              },
            });
          }

          const change = data.change;
          if (change) {
            return renderListCell({
              text: changeText(change),
              textClassName: 'padding-vertical-8',
            });
          }

          const external = data.external;
          if (external) {
            return (
              <div className="flex-row flex-center rhythm-horizontal-8 padding-vertical-8">
                <Icon iconName="fluent-WarningColor" size={IconSize.medium} />
                <span>
                  <strong>{external.groupName}</strong> was changed outside
                  the extension
                  {external.detectedAt && (
                    <>
                      {' '}
                      (<Ago date={new Date(external.detectedAt)} />)
                    </>
                  )}
                  . History continuity is interrupted.
                </span>
              </div>
            );
          }

          return undefined;
        },
        renderActions: () => undefined,
        width: new ObservableValue(-40),
      }),
      createActionColumn<HistoryTreeItem>({
        id: 'groups',
        name: 'Groups',
        width: new ObservableValue(-60),
        renderCell: ({ data }) => {
          const save = data.save;
          if (save) {
            return (
              // fade keeps every save on one row: the group list is clipped
              // with a fade and a "show more" pill once it outgrows the
              // column, and expanding the row lists all the groups anyway.
              <PillGroup
                className="flex-center"
                overflow={PillGroupOverflow.fade}
              >
                {save.entries.map((entry) => (
                  <Pill key={entry.groupId} size={PillSize.compact}>
                    {entry.groupName}
                  </Pill>
                ))}
              </PillGroup>
            );
          }

          return <span className="flex-row flex-grow" />;
        },
        renderActions: () => undefined,
      }),
      createActionColumn<HistoryTreeItem>({
        id: 'changeCount',
        name: '',
        // Fixed width: the column only ever holds a small count, so it
        // should not grow with the dialog.
        width: new ObservableValue(120),
        renderCell: ({ data }) => {
          const save = data.save;
          if (save) {
            const changeCount = save.entries.reduce(
              (sum, entry) => sum + entry.changes.length,
              0,
            );
            return (
              <span className="secondary-text white-space-nowrap flex-self-center flex-grow text-right">
                {changeCount} {changeCount === 1 ? 'change' : 'changes'}
              </span>
            );
          }

          return <span className="flex-row flex-grow" />;
        },
        renderActions: ({ data }) => {
          const change = data.change;
          if (change) {
            return <StateIcon state={statusState[change.status]} />;
          }

          return undefined;
        },
      }),
    ];

    return columns;
  }, []);

  return { columns };
};

const HistoryTree = ({
  itemProvider,
}: {
  itemProvider: ITreeItemProvider<HistoryTreeItem>;
}) => {
  const { columns } = useColumns();
  return (
    <Tree<HistoryTreeItem>
      id={'history-tree'}
      className="history-tree text-field-table-wrap"
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

export const HistoryContent = () => {
  const history = useHistory();
  const groups = useVariableGroups();
  const queryClient = useQueryClient();

  // History and variable groups are cached with staleTime: Infinity, so a
  // component that stays mounted across saves could otherwise show
  // permanently stale data. Refetch once whenever this view is opened.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only refresh, not tied to queryClient identity
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: historyQueryKey });
    queryClient.invalidateQueries({ queryKey: ['variable-groups'] });
  }, []);

  const itemProvider = useMemo(() => {
    if (!history.data) return undefined;
    const currentModifiedOn: Record<number, string | undefined> =
      Object.fromEntries(
        (groups.data ?? []).map((g) => [
          g.id,
          (g.modifiedOn ?? g.createdOn)?.toISOString(),
        ]),
      );
    const items = buildSaveEvents(
      buildTimeline(history.data, currentModifiedOn),
    );
    return new TreeItemProvider(mapTreeItems(items));
  }, [history.data, groups.data]);

  if (!itemProvider) {
    return <Spinner size={SpinnerSize.large} className="margin-16" />;
  }

  if (!itemProvider.roots.length) {
    return (
      <div className="margin-16 secondary-text">
        No history yet. Changes saved through this extension will appear
        here.
      </div>
    );
  }

  return <HistoryTree itemProvider={itemProvider} />;
};
