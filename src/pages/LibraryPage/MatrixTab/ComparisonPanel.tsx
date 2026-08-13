import './ComparisonPanel.scss';

import { Icon, IconSize } from 'azure-devops-ui/Icon';
import { Observer } from 'azure-devops-ui/Observer';
import { Fragment } from 'react';
import type { ObservableMatrixVariable } from '@/features/variable-groups/models';
import type { VariableGroupName } from './MatrixTree';

export type ComparisonPanelProps = {
  variable: ObservableMatrixVariable;
  groupNames: VariableGroupName[];
};

// Read-only "cloud" that transposes the focused matrix row into vertical
// group → value pairs. pointer-events: none — clicking it would blur the row
// and hide the panel anyway, so clicks fall through to the table instead.
export const ComparisonPanel = ({
  variable,
  groupNames,
}: ComparisonPanelProps) => (
  <div className="comparison-panel">
    <Observer name={variable.name.name} isSecret={variable.name.isSecret}>
      {({ name, isSecret }: { name: string; isSecret: boolean | null }) => (
        <div className="comparison-panel-header flex-row flex-center">
          <Icon
            iconName={
              isSecret == null
                ? 'fluent-WarningColor'
                : isSecret
                  ? 'fluent-KeyRegular'
                  : 'fluent-MathFormulaRegular'
            }
            size={IconSize.medium}
          />
          <span className="comparison-panel-name text-ellipsis">{name}</span>
        </div>
      )}
    </Observer>
    <div className="comparison-panel-grid">
      {groupNames.map((group) => {
        const cell = variable.values[group.id];
        if (!cell) {
          return null;
        }
        return (
          <Fragment key={group.id}>
            <span className="comparison-panel-group text-ellipsis">
              {group.name}
            </span>
            <Observer
              value={cell.value}
              present={cell.present}
              isSecret={variable.name.isSecret}
            >
              {({
                value,
                present,
                isSecret,
              }: {
                value: string;
                present: boolean;
                isSecret: boolean | null;
              }) => {
                if (cell.isNew && !present) {
                  return <span className="comparison-panel-null">NULL</span>;
                }

                if (isSecret ?? cell.isSecretInitial) {
                  return (
                    <span className="comparison-panel-secret">******</span>
                  );
                }

                return (
                  <span className="comparison-panel-value text-ellipsis">
                    {value}
                  </span>
                );
              }}
            </Observer>
          </Fragment>
        );
      })}
    </div>
  </div>
);
