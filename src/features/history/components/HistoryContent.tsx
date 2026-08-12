import { useQueryClient } from '@tanstack/react-query';
import { Ago } from 'azure-devops-ui/Ago';
import { Icon, IconSize } from 'azure-devops-ui/Icon';
import { Pill, PillSize } from 'azure-devops-ui/Pill';
import { PillGroup, PillGroupOverflow } from 'azure-devops-ui/PillGroup';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import type { IIdentityDetailsProvider } from 'azure-devops-ui/VssPersona';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import { useEffect, useMemo, useState } from 'react';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { getProjectUrl } from '@/shared/api/configurations';
import { StateIcon, States } from '@/shared/components/StateIcon';
import {
  buildSaveEvents,
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

const SaveEventRow = ({ event }: { event: SaveEventItem }) => {
  const [expanded, setExpanded] = useState(false);

  const changeCount = event.entries.reduce(
    (sum, entry) => sum + entry.changes.length,
    0,
  );

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <div className="flex-column depth-4 padding-8 rhythm-vertical-8">
      <button
        type="button"
        className="flex-row flex-center rhythm-horizontal-8 cursor-pointer"
        style={{
          background: 'none',
          border: 0,
          padding: 0,
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
          width: '100%',
        }}
        aria-expanded={expanded}
        onClick={toggle}
      >
        <Icon
          iconName={expanded ? 'ChevronDown' : 'ChevronRight'}
          size={IconSize.small}
        />
        <VssPersona
          identityDetailsProvider={getActorIdentityDetailsProvider(
            event.actor,
          )}
          size="extra-small"
        />
        <span className="secondary-text">{event.actor.displayName}</span>
        <Ago date={new Date(event.timestamp)} />
        <PillGroup className="flex-grow" overflow={PillGroupOverflow.wrap}>
          {event.entries.map((entry) => (
            <Pill key={entry.groupId} size={PillSize.compact}>
              {entry.groupName}
            </Pill>
          ))}
        </PillGroup>
        <span className="secondary-text no-wrap">
          {changeCount} {changeCount === 1 ? 'change' : 'changes'}
        </span>
      </button>
      {expanded && (
        <div
          className="flex-column rhythm-vertical-8"
          style={{ paddingLeft: 24 }}
        >
          {event.entries.map((entry) => (
            <div key={entry.id} className="flex-column rhythm-vertical-4">
              <div className="flex-row flex-center rhythm-horizontal-8">
                <Icon iconName="fluent-LibraryColor" size={IconSize.medium} />
                <strong>{entry.groupName}</strong>
              </div>
              {entry.changes.map((change) => (
                <div
                  key={`${change.key}-${change.status}`}
                  className="flex-row flex-center rhythm-horizontal-8"
                >
                  <StateIcon state={statusState[change.status]} />
                  <span>{changeText(change)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
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

  const items = useMemo<HistoryListItem[] | undefined>(() => {
    if (!history.data) return undefined;
    const currentModifiedOn: Record<number, string | undefined> =
      Object.fromEntries(
        (groups.data ?? []).map((g) => [
          g.id,
          (g.modifiedOn ?? g.createdOn)?.toISOString(),
        ]),
      );
    return buildSaveEvents(buildTimeline(history.data, currentModifiedOn));
  }, [history.data, groups.data]);

  if (!items) {
    return <Spinner size={SpinnerSize.large} className="margin-16" />;
  }

  if (!items.length) {
    return (
      <div className="margin-16 secondary-text">
        No history yet. Changes saved through this extension will appear
        here.
      </div>
    );
  }

  return (
    <div className="flex-column rhythm-vertical-8 padding-16">
      {items.map((item) =>
        item.kind === 'external' ? (
          <div
            key={item.key}
            className="flex-row flex-center rhythm-horizontal-8 padding-8"
          >
            <Icon iconName="fluent-WarningColor" size={IconSize.medium} />
            <span>
              <strong>{item.groupName}</strong> was changed outside the
              extension
              {item.detectedAt && (
                <>
                  {' '}
                  (<Ago date={new Date(item.detectedAt)} />)
                </>
              )}
              . History continuity is interrupted.
            </span>
          </div>
        ) : (
          <SaveEventRow key={item.key} event={item} />
        ),
      )}
    </div>
  );
};
