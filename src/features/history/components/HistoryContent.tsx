import './HistoryContent.scss';

import { useQueryClient } from '@tanstack/react-query';
import type { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { Ago } from 'azure-devops-ui/Ago';
import {
  ObservableLike,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { IconSize, type IIconProps } from 'azure-devops-ui/Icon';
import { renderListCell } from 'azure-devops-ui/List';
import { Pill, PillSize } from 'azure-devops-ui/Pill';
import { PillGroup, PillGroupOverflow } from 'azure-devops-ui/PillGroup';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
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
import {
  useVariableGroups,
  variableGroupsQueryKey,
} from '@/features/variable-groups/hooks/useVariableGroups';
import { getProjectUrl } from '@/shared/api/configurations';
import { StateIcon, States } from '@/shared/components/StateIcon';
import { createActionColumn } from '@/shared/components/Tree/createActionColumn';
import { createExpandableActionColumn } from '@/shared/components/Tree/createExpandableActionColumn';
import type { TreeItemProviderProp } from '@/shared/components/Tree/treeProps';
import {
  buildSaveEvents,
  type ExternalItem,
  type HistoryListItem,
  type SaveEventItem,
} from '../buildSaveEvents';
import { buildTimeline } from '../buildTimeline';
import { historyQueryKey, useHistory } from '../hooks/useHistory';
import type { HistoryEntryChange, HistorySaveEntry } from '../models';

const statusState = {
  added: States.New,
  modified: States.Modified,
  deleted: States.Deleted,
  renamed: States.Modified,
} as const;

const changeText = (c: HistoryEntryChange) =>
  c.status === 'renamed' ? `${c.key} → ${c.renamedTo}` : c.key;

// Drawn exactly like the group and variable icons in these rows; the class
// only carries the correction for standing next to a plain label.
const warningIconProps: IIconProps = {
  iconName: 'fluent-WarningColor',
  size: IconSize.medium,
  className: 'history-warning-icon',
};

const WarningLabel = ({
  text,
  textClassName,
}: {
  text: string;
  textClassName?: string;
}) =>
  renderListCell({
    text,
    textClassName,
    iconProps: warningIconProps,
  });

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
        {/* The persona sits a pixel above the text it stands next to; the
            Home tab corrects it the same way (see LastModifiedByCell). */}
        <span style={{ marginTop: 1 }}>
          <VssPersona
            identityDetailsProvider={getActorIdentityDetailsProvider(actor)}
            size="extra-small"
          />
        </span>
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
  group?: HistorySaveEntry;
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
          <WarningLabel
            text={externalDetailText}
            textClassName="padding-vertical-8"
          />
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
    const onSize = (
      _event: MouseEvent | KeyboardEvent,
      index: number,
      width: number,
    ) => {
      const column = columns[index];
      if (column) {
        (column.width as ObservableValue<number>).value = width;
      }
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
              return (
                <ActorCell
                  // A recorded change knows who made it; one nobody has saved
                  // over yet is still the group's latest, so read it off there.
                  actor={
                    external.actor ??
                    resolveGroup(external.groupId, external.groupName)
                      .modifiedBy
                  }
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
              const name = resolveGroup(group.groupId, group.groupName).name;
              const renamedFrom =
                'renamedFrom' in group ? group.renamedFrom : undefined;

              return renderListCell({
                text: renamedFrom ? `${renamedFrom} → ${name}` : name,
                textClassName: 'padding-vertical-8 min-width-0',
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
                textClassName: 'padding-vertical-8 min-width-0',
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
          // Fixed width: the column only ever holds a count or the external
          // marker, so it should not grow with the dialog.
          width: new ObservableValue(160),
          renderCell: ({ data }) => {
            const save = data.save;
            if (save) {
              // Renaming the group is a change of its own, and can be the
              // only one a save carries.
              const changeCount = save.entries.reduce(
                (sum, entry) =>
                  sum + entry.changes.length + (entry.renamedFrom ? 1 : 0),
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
                <span className="flex-row flex-grow justify-end padding-horizontal-8 margin-horizontal-4">
                  <WarningLabel
                    text="external change"
                    textClassName="secondary-text white-space-nowrap"
                  />
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
      itemProvider={itemProvider as TreeItemProviderProp<HistoryTreeItem>}
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
    queryClient.invalidateQueries({ queryKey: variableGroupsQueryKey });
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
