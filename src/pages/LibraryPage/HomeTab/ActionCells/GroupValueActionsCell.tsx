import { type IContextualMenuProps, MenuButton } from 'azure-devops-ui/Menu';
import { Observer } from 'azure-devops-ui/Observer';
import { useMemo } from 'react';
import { stringify as yamlStringify } from 'yaml';
import { getVariableGroupById } from '@/features/variable-groups/hooks/useVariableGroups';
import type { ObservableVariableGroup } from '@/features/variable-groups/models';
import { StateIcon } from '@/shared/components/State';
import { useTreeRow } from '@/shared/components/Tree/useTreeRow';
import { expandObject } from '@/shared/lib/exportHelper';

export const GroupValueActionsCell = ({
  data,
}: {
  data: ObservableVariableGroup;
}) => {
  const { onBlur, hasMouse, hasFocus } = useTreeRow();
  const hasMouseOrFocus = hasMouse || hasFocus;

  const contextMenuProps = useMemo<IContextualMenuProps>(() => {
    const getExportVariables = async () => {
      const group = await getVariableGroupById(data.id);
      const varibles = Object.fromEntries(
        Object.entries(group.variables).map(([name, variable]) => [
          name,
          variable.value,
        ]),
      );

      return { groupName: group.name, variables: expandObject(varibles) };
    };

    return {
      menuProps: {
        id: 'group-menu',
        items: [
          {
            id: 'download-json',
            text: 'Download as JSON',
            onActivate: () => {
              getExportVariables().then((data) => {
                const jsonText = JSON.stringify(data.variables, null, 2);
                downloadFile(
                  jsonText,
                  `${data.groupName}.json`,
                  'application/json',
                );
              });

              return false;
            },
          },
          {
            id: 'download-yaml',
            text: 'Download as YAML',
            onActivate: () => {
              getExportVariables().then((data) => {
                const yamlText = yamlStringify(data.variables);
                downloadFile(
                  yamlText,
                  `${data.groupName}.yaml`,
                  'application/yaml',
                );
              });

              return false;
            },
          },
        ],
      },
    };
  }, [data.id]);

  if (!hasMouseOrFocus) {
    return (
      <Observer state={data.state}>
        {({ state }) => <StateIcon state={state} circle />}
      </Observer>
    );
  }

  return (
    <MenuButton
      subtle
      onBlur={onBlur}
      onCollapse={onBlur}
      hideDropdownIcon
      iconProps={{
        iconName: 'MoreVertical',
      }}
      contextualMenuProps={contextMenuProps}
    />
  );
};
function downloadFile(jsonText: string, arg1: string, arg2: string) {
  throw new Error('Function not implemented.');
}
