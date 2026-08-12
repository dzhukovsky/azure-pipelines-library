import { useQueryClient } from '@tanstack/react-query';
import { Ago } from 'azure-devops-ui/Ago';
import { Icon, IconSize } from 'azure-devops-ui/Icon';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import type { IIdentityDetailsProvider } from 'azure-devops-ui/VssPersona';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import { useEffect, useMemo } from 'react';
import { useVariableGroups } from '@/features/variable-groups/hooks/useVariableGroups';
import { getProjectUrl } from '@/shared/api/configurations';
import { StateIcon, States } from '@/shared/components/StateIcon';
import { buildTimeline } from '../buildTimeline';
import { historyQueryKey, useHistory } from '../hooks/useHistory';
import type { HistoryEntry, HistoryEntryChange, TimelineItem } from '../models';

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

  const timeline = useMemo<TimelineItem[] | undefined>(() => {
    if (!history.data) return undefined;
    const currentModifiedOn: Record<number, string | undefined> =
      Object.fromEntries(
        (groups.data ?? []).map((g) => [
          g.id,
          (g.modifiedOn ?? g.createdOn)?.toISOString(),
        ]),
      );
    return buildTimeline(history.data, currentModifiedOn);
  }, [history.data, groups.data]);

  if (!timeline) {
    return <Spinner size={SpinnerSize.large} className="margin-16" />;
  }

  if (!timeline.length) {
    return (
      <div className="margin-16 secondary-text">
        No history yet. Changes saved through this extension will appear
        here.
      </div>
    );
  }

  // Every external marker is immediately followed by the entry that
  // triggered it (see buildTimeline), so that entry's id makes a stable key.
  const keyedTimeline = timeline.map((item, index) => ({
    item,
    key:
      item.kind === 'entry'
        ? item.entry.id
        : `external-${(timeline[index + 1] as { entry: HistoryEntry }).entry.id}`,
  }));

  return (
    <div className="flex-column rhythm-vertical-8 padding-16">
      {keyedTimeline.map(({ item, key }) =>
        item.kind === 'external' ? (
          <div
            key={key}
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
          <div
            key={key}
            className="flex-column depth-4 padding-8 rhythm-vertical-4"
          >
            <div className="flex-row flex-center rhythm-horizontal-8">
              <strong>{item.entry.groupName}</strong>
              <VssPersona
                identityDetailsProvider={getActorIdentityDetailsProvider(
                  item.entry.actor,
                )}
                size="extra-small"
              />
              <span className="secondary-text">
                {item.entry.actor.displayName}
              </span>
              <Ago date={new Date(item.entry.timestamp)} />
            </div>
            <div className="flex-column rhythm-vertical-4">
              {item.entry.changes.map((change) => (
                <div
                  key={`${change.key}-${change.status}`}
                  className="flex-row flex-center rhythm-horizontal-8"
                >
                  <StateIcon state={statusState[change.status]} />
                  <span>{changeText(change)}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
};
