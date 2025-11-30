import { ContentSize } from 'azure-devops-ui/Callout';
import { ConditionalChildren } from 'azure-devops-ui/ConditionalChildren';
import type { IObservableValue } from 'azure-devops-ui/Core/Observable';
import { Dialog } from 'azure-devops-ui/Dialog';
import { TitleSize } from 'azure-devops-ui/Header';
import { Tree } from 'azure-devops-ui/TreeEx';
import type { ObservableSecureFile } from '@/models/SecureFile';
import type { ObservableVariableGroup } from '@/models/VariableGroup';

export interface IPreviewChangesDialogProps {
  isOpen: IObservableValue<boolean>;
}

export const PreviewChangesDialog = ({
  isOpen,
}: IPreviewChangesDialogProps) => {
  return (
    <ConditionalChildren renderChildren={isOpen}>
      <Dialog
        titleProps={{ text: 'Preview changes', size: TitleSize.Large }}
        contentSize={ContentSize.ExtraLarge}
        modal={true}
        escDismiss={false}
        lightDismiss={false}
        footerButtonProps={[
          {
            text: 'Cancel',
            onClick: () => {
              isOpen.value = false;
            },
          },
          {
            text: 'Save Changes',
            onClick: () => {
              isOpen.value = false;
            },
            primary: true,
          },
        ]}
        onDismiss={() => {
          isOpen.value = false;
        }}
      >
        <div style={{ overflow: 'hidden', minHeight: '30vh' }}>
          You have modified this work item. You can save, discard, or cancel.
        </div>
      </Dialog>
    </ConditionalChildren>
  );
};

export type ChangesModel = {
  variableGroups: ObservableVariableGroup[];
  secureFiles: ObservableSecureFile[];
};

// const PreviewChangesTree = ({ items }: VariablesTreeProps) => {
//   const { columns } = useColumns(items);

//   return (
//     <Tree<LibraryItem>
//       id={'variables-tree'}
//       className="text-field-table-wrap"
//       columns={columns}
//       itemProvider={items}
//       showLines={false}
//       virtualize={false}
//     />
//   );
// };
