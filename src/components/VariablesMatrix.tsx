import { KeyRegular } from '@fluentui/react-icons/fonts';
import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import { Button } from 'azure-devops-ui/Button';
import { Card } from 'azure-devops-ui/Card';
import {
  type IObservableValue,
  type IReadonlyObservableArray,
  ObservableArray,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { type ITableColumn, Table, TableCell } from 'azure-devops-ui/Table';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useCallback, useMemo } from 'react';
import { useFiltering } from '../hooks/filtering';
import { type SortFunc, useSorting } from '../hooks/sorting';
import {
  renderTextFieldCell,
  type Status,
  StatusTypes,
} from './TextFieldTableCell';

interface IVariablesMatrixProps {
  variableGroups: VariableGroup[];
  filter: IFilter;
}
interface IVariableItem {
  name: IObservableValue<string>;
  originalName?: string;
  status: IObservableValue<Status | undefined>;
  readonly: boolean;
  values: ValuesObject;
}

type ValuesObject = Record<string, ValuesItem>;

type ValuesItem = {
  value: IObservableValue<string>;
  originalValue?: string;
  status: IObservableValue<Status | undefined>;
  isSecret: boolean;
};

const filterFunc = (item: IVariableItem, text: string) => {
  let includeItem = true;

  if (text) {
    includeItem =
      item.name.value?.toLocaleLowerCase().includes(text) ||
      Object.entries(item.values).some(([, value]) =>
        value.value.value?.toLocaleLowerCase().includes(text),
      );
  }

  return includeItem;
};

const useColumns = (
  variableGroups: VariableGroup[],
  variables: IReadonlyObservableArray<IVariableItem>,
) => {
  const columns = useMemo(() => {
    const renderNameColumn = (
      _rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<IVariableItem>,
      tableItem: IVariableItem,
    ) => {
      const isSecret = Object.values(tableItem.values).some((v) => v.isSecret);

      return (
        <TableCell
          key={`col-${columnIndex}`}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
        >
          {renderTextFieldCell(
            tableItem.name,
            tableItem.status,
            {
              render: isSecret
                ? (className) => (
                    <KeyRegular
                      className={className}
                      style={{ paddingLeft: '6px' }}
                    />
                  )
                : undefined,
              iconName: isSecret ? undefined : 'Variable',
            },
            {
              readOnly: isSecret,
              placeholder: 'Name (required)',
              required: true,
            },
            (newName) => {
              tableItem.status.value =
                validateRequiredName(newName) ??
                validateNameUniqueness(newName, variables.value) ??
                getStatus(newName, tableItem.originalName);
            },
          )}
        </TableCell>
      );
    };

    const renderValueColumn = (
      _rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<IVariableItem>,
      tableItem: IVariableItem,
    ) => {
      const id = +tableColumn.id;
      const variable = tableItem.values[id];

      return (
        <TableCell
          key={`col-${columnIndex}`}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
        >
          {renderTextFieldCell(
            variable.value,
            variable.status,
            undefined,
            { inputType: variable.isSecret ? 'password' : 'text' },
            (newValue) => {
              variable.status.value = getStatus(
                newValue,
                variable.originalValue,
              );
            },
          )}
        </TableCell>
      );
    };

    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns: ITableColumn<IVariableItem>[] = [
      {
        id: 'name',
        name: 'Name',
        onSize,
        renderCell: renderNameColumn,
        sortProps: {
          ariaLabelAscending: 'Sorted A to Z',
          ariaLabelDescending: 'Sorted Z to A',
        },
        width: new ObservableValue(-20),
      },
      ...variableGroups.map<ITableColumn<IVariableItem>>((vg) => ({
        id: vg.id.toString(),
        name: vg.name,
        onSize,
        renderCell: renderValueColumn,
        sortProps: {
          ariaLabelAscending: 'Sorted A to Z',
          ariaLabelDescending: 'Sorted Z to A',
        },
        width: new ObservableValue(-15),
      })),
    ];

    return columns;
  }, [variableGroups, variables]);

  const sortFunctions = useMemo<SortFunc<IVariableItem>[]>(
    () => [
      (a, b) => (a.name.value ?? '').localeCompare(b.name.value ?? ''),
      ...variableGroups.map<SortFunc<IVariableItem>>(
        (vg) => (a, b) =>
          (a.values[vg.id]?.value.value ?? '').localeCompare(
            b.values[vg.id]?.value.value ?? '',
          ),
      ),
    ],
    [variableGroups],
  );

  return { columns, sortFunctions };
};

const getStatus = (newValue: string, originalValue?: string) => {
  if (originalValue === undefined) {
    return StatusTypes.Untracked;
  }

  if (newValue !== originalValue) {
    return StatusTypes.Modified;
  }

  return undefined;
};

const validateRequiredName = (variableName: string): Status | undefined => {
  if (!variableName?.trim()) {
    return { type: 'Error', message: 'Name is required' };
  }

  return undefined;
};

const validateNameUniqueness = (
  variableName: string,
  variables: IVariableItem[],
): Status | undefined => {
  variableName = variableName?.trim().toLocaleLowerCase();
  const count = variables.filter(
    (v) => v.name.value?.trim().toLocaleLowerCase() === variableName,
  ).length;

  if (count > 1) {
    return { type: 'Error', message: 'Names must be unique' };
  }

  return undefined;
};

const useVariables = (variableGroups: VariableGroup[]) => {
  const variables = useMemo(() => {
    const variableNames = [
      ...new Set<string>(
        variableGroups.flatMap((vg) => Object.keys(vg.variables)),
      ),
    ];

    const secretVariables = new Set<string>(
      variableGroups.flatMap((vg) =>
        Object.entries(vg.variables)
          .filter(([, v]) => v.isSecret)
          .map(([k]) => k),
      ),
    );

    const values: Record<string, ValuesObject> = {};

    variableGroups.forEach((vg) => {
      variableNames.forEach((name) => {
        if (!values[name]) {
          values[name] = {};
        }
        const isSecret = secretVariables.has(name);
        const variable = vg.variables[name];
        values[name][vg.id] = (variable && {
          value: new ObservableValue(variable.value ?? ''),
          originalValue: variable.value ?? '',
          status: new ObservableValue(undefined),
          isSecret,
        }) || {
          value: new ObservableValue(''),
          status: new ObservableValue(StatusTypes.Untracked),
          isSecret,
        };
      });
    });

    const variables: IVariableItem[] = variableNames.map((name) => ({
      name: new ObservableValue(name),
      originalName: name,
      status: new ObservableValue(undefined),
      readonly: Object.values(values[name]).some((v) => v.isSecret),
      values: values[name],
    }));

    return new ObservableArray<IVariableItem>(variables);
  }, [variableGroups]);

  const addNewVariable = useCallback(() => {
    const values: ValuesObject = {};
    variableGroups.forEach((vg) => {
      values[vg.id] = {
        value: new ObservableValue(''),
        status: new ObservableValue(StatusTypes.Untracked),
        isSecret: false,
      };
    });

    const newVariable: IVariableItem = {
      name: new ObservableValue(''),
      status: new ObservableValue(StatusTypes.Untracked),
      readonly: false,
      values,
    };

    variables.push(newVariable);
  }, [variableGroups, variables]);

  return { variables, addNewVariable };
};

export const VariablesMatrix = ({
  variableGroups,
  filter,
}: IVariablesMatrixProps) => {
  const { variables, addNewVariable } = useVariables(variableGroups);
  const { columns, sortFunctions } = useColumns(variableGroups, variables);

  const { sortedItems, sortingBehavior } = useSorting(
    columns,
    variables,
    sortFunctions,
  );

  const { filteredItems, hasItems } = useFiltering(
    sortedItems,
    filter,
    filterFunc,
  );

  return (
    (hasItems && (
      <div className="flex-column spacing-8">
        <Card
          className="flex-grow bolt-card-no-vertical-padding"
          contentProps={{ contentPadding: false }}
        >
          <Table<IVariableItem>
            className="text-field-table-wrap focusable-text-field-rows"
            behaviors={[sortingBehavior]}
            columns={columns}
            selectRowOnClick={false}
            itemProvider={filteredItems}
            showLines={false}
          />
        </Card>
        <div className="flex-row margin-vertical-16">
          <Button
            iconProps={{ iconName: 'Add' }}
            text="Add new variable"
            onClick={addNewVariable}
          />
        </div>
      </div>
    )) || <span>No items found</span>
  );
};
