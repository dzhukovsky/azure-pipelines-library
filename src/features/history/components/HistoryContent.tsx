import './HistoryContent.scss';

import { useQueryClient } from '@tanstack/react-query';
import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { Ago } from 'azure-devops-ui/Ago';
import {
  ObservableLike,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { Icon, IconSize } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { Pill, PillSize } from 'azure-devops-ui/Pill';
import { PillGroup, PillGroupOverflow } from 'azure-devops-ui/PillGroup';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { Tooltip } from 'azure-devops-ui/TooltipEx';
import {
  ExpandableTreeCell,
  type ITreeColumn,
  Tree,
} from 'azure-devops-ui/TreeEx';
import type { ITreeItem } from 'azure-devops-ui/Utilities/TreeItemProvider';
import {
  type ITreeItemProvider,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { IIdentityDetailsProvider } from 'azure-devops-ui/VssPersona';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import { Fragment, useEffect, useMemo } from 'react';
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

type Actor = { id: string; displayName: string };

const getActorIdentityDetailsProvider = (
  actor: Actor,
): IIdentityDetailsProvider => {
  const projectUrl = getProjectUrl();

  return {
    getDisplayName: () => actor.displayName,
    getIdentityImageUrl: (size) =>
      `${projectUrl}/_api/_common/IdentityImage?id=${actor.id}&size=${size}`,
  };
};

// Every row that names a person — a save or a change made outside the
// extension — presents them the same way.
const ActorCell = ({ actor, date }: { actor?: Actor; date?: Date }) => (
  <div className="flex-row flex-center rhythm-horizontal-8 padding-vertical-8">
    {actor && (
      <>
        <VssPersona
          identityDetailsProvider={getActorIdentityDetailsProvider(actor)}
          size="extra-small"
        />
        <span>{actor.displayName}</span>
      </>
    )}
    {date && (
      <span className="secondary-text">
        <Ago date={date} />
      </span>
    )}
  </div>
);

// Same optional-field row shape the Preview changes tree uses.
type HistoryTreeItem = {
  save?: SaveEventItem;
  group?: HistoryEntry;
  change?: HistoryEntryChange;
  external?: ExternalItem;
  externalGroup?: ExternalItem;
  externalDetail?: ExternalItem;
};

const mapTreeItems = (items: HistoryListItem[]): ITreeItem<HistoryTreeItem>[] =>
  items.map<ITreeItem<HistoryTreeItem>>((item) =>
    item.kind === 'external'
      ? {
          data: { external: item },
          expanded: false,
          // Mirrors a save event's shape — the affected group, and inside it
          // what happened to it — so both kinds of row expand alike.
          childItems: [
            {
              data: { externalGroup: item },
              expanded: true,
              childItems: [{ data: { externalDetail: item } }],
            },
          ],
        }
      : {
          data: { save: item },
          expanded: false,
          childItems: item.entries.map<ITreeItem<HistoryTreeItem>>((entry) => ({
            data: { group: entry },
            // Groups come pre-expanded so opening a save event shows the
            // changed variables right away.
            expanded: true,
            childItems: entry.changes.map<ITreeItem<HistoryTreeItem>>(
              (change) => ({ data: { change } }),
            ),
          })),
        },
  );

/**
 * Groups get renamed, so an entry's stored name can be out of date: resolve
 * what the group looks like today — including who last touched it, which is
 * the person behind an external change — and fall back to the recorded name
 * only when the group is gone.
 */
export type GroupResolver = (
  groupId: number,
  recordedName: string,
) => { name: string; modifiedBy?: IdentityRef };

// The group is named by the row above this one, so the sentence only has to
// say what happened to it.
const externalDetailText =
  'Changed outside the extension, so the entries below no longer describe how this group reached its current state.';

// The detail row is a sentence, not a value that belongs to a column: let its
// first cell span the whole table and drop the remaining cells. It stays an
// ExpandableTreeCell so it keeps the indentation of the rows around it.
const spanDetailRows = (
  column: ITreeColumn<HistoryTreeItem>,
  colspan?: number,
): ITreeColumn<HistoryTreeItem> => ({
  ...column,
  renderCell: (
    rowIndex,
    columnIndex,
    tableColumn,
    treeItem,
    ariaRowIndex,
    role,
  ) => {
    const { externalDetail } = ObservableLike.getValue(
      treeItem.underlyingItem.data,
    );

    if (!externalDetail) {
      return column.renderCell(
        rowIndex,
        columnIndex,
        tableColumn,
        treeItem,
        ariaRowIndex,
        role,
      );
    }

    // Columns without a colspan render no cell at all for these rows — the
    // spanning cell above already covers their width.
    return colspan ? (
      ExpandableTreeCell({
        children: (
          <div className="flex-row flex-center rhythm-horizontal-8 padding-vertical-8">
            <Icon iconName="fluent-WarningColor" size={IconSize.medium} />
            <Tooltip text={externalDetailText} overflowOnly>
              <span className="text-ellipsis">{externalDetailText}</span>
            </Tooltip>
          </div>
        ),
        colspan,
        columnIndex,
        contentClassName: 'padding-vertical-0',
        role,
        treeColumn: tableColumn,
        treeItem,
      })
    ) : (
      <Fragment key={columnIndex} />
    );
  },
});

const useColumns = (resolveGroup: GroupResolver) => {
  const columns = useMemo(() => {
    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns: ITreeColumn<HistoryTreeItem>[] = [
      spanDetailRows(
        createExpandableActionColumn<HistoryTreeItem>({
          id: 'change',
          name: 'Change',
          contentClassName: 'padding-vertical-0 padding-right-0',
          onSize,
          renderCell: ({ data }) => {
            const save = data.save;
            if (save) {
              return (
                <ActorCell actor={save.actor} date={new Date(save.timestamp)} />
              );
            }

            const external = data.external;
            if (external) {
              const { modifiedBy } = resolveGroup(
                external.groupId,
                external.groupName,
              );
              return (
                <ActorCell
                  actor={modifiedBy}
                  date={
                    external.detectedAt
                      ? new Date(external.detectedAt)
                      : undefined
                  }
                />
              );
            }

            // A save lists one row per affected group; an external change
            // names the single group it hit the same way.
            const group = data.group ?? data.externalGroup;
            if (group) {
              return renderListCell({
                text: resolveGroup(group.groupId, group.groupName).name,
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

            return undefined;
          },
          renderActions: () => undefined,
          width: new ObservableValue(-40),
        }),
        // The detail row spans every content column of the table.
        3,
      ),
      spanDetailRows(
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
                      {resolveGroup(entry.groupId, entry.groupName).name}
                    </Pill>
                  ))}
                </PillGroup>
              );
            }

            const external = data.external;
            if (external) {
              return (
                <PillGroup
                  className="flex-center"
                  overflow={PillGroupOverflow.fade}
                >
                  <Pill size={PillSize.compact}>
                    {resolveGroup(external.groupId, external.groupName).name}
                  </Pill>
                </PillGroup>
              );
            }

            return <span className="flex-row flex-grow" />;
          },
          renderActions: () => undefined,
        }),
      ),
      spanDetailRows(
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
                // Same horizontal insets StateIcon carries, so the count and
                // the per-variable status icons below it end on one line.
                <span className="secondary-text white-space-nowrap flex-self-center flex-grow text-right padding-horizontal-8 margin-horizontal-4">
                  {changeCount} {changeCount === 1 ? 'change' : 'changes'}
                </span>
              );
            }

            if (data.external) {
              return (
                <span className="flex-row flex-center flex-grow justify-end rhythm-horizontal-4 white-space-nowrap padding-horizontal-8 margin-horizontal-4">
                  <Icon iconName="fluent-WarningColor" size={IconSize.medium} />
                  <span className="secondary-text">interrupted</span>
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
      ),
    ];

    return columns;
  }, [resolveGroup]);

  return { columns };
};

const HistoryTree = ({
  itemProvider,
  resolveGroup,
}: {
  itemProvider: ITreeItemProvider<HistoryTreeItem>;
  resolveGroup: GroupResolver;
}) => {
  const { columns } = useColumns(resolveGroup);
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

  const resolveGroup = useMemo<GroupResolver>(() => {
    const current = new Map((groups.data ?? []).map((g) => [g.id, g]));
    return (groupId, recordedName) => {
      const group = current.get(groupId);
      return {
        name: group?.name ?? recordedName,
        modifiedBy: group?.modifiedBy ?? group?.createdBy,
      };
    };
  }, [groups.data]);

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
        No history yet. Changes saved through this extension will appear here.
      </div>
    );
  }

  return (
    <HistoryTree itemProvider={itemProvider} resolveGroup={resolveGroup} />
  );
};
