import { type IContextualMenuProps, MenuButton } from 'azure-devops-ui/Menu';
import { useMemo } from 'react';
import { stringify as yamlStringify } from 'yaml';
import { useTreeRow } from '@/components/shared/Tree/useTreeRow';
import { downloadFile, expandObject } from '@/helpers/exportHelper';
import { getVariableGroupById } from '@/hooks/query/variableGroups';
import type { ObservableVariableGroup } from '@/models/VariableGroup';

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
    return <span />;
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
