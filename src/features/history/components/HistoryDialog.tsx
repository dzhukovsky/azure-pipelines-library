import './HistoryDialog.scss';

import { CustomDialog } from 'azure-devops-ui/Dialog';
import { TitleSize } from 'azure-devops-ui/Header';
import { PanelFooter, PanelHeader } from 'azure-devops-ui/Panel';
import { HistoryContent } from './HistoryContent';

export interface IHistoryDialogProps {
  onDismiss: () => void;
}

export const HistoryDialog = ({ onDismiss }: IHistoryDialogProps) => (
  <CustomDialog
    calloutContentClassName="history-dialog"
    modal={true}
    escDismiss={false}
    lightDismiss={false}
    onDismiss={onDismiss}
  >
    <PanelHeader
      titleProps={{ text: 'History', size: TitleSize.Large }}
      description="Changes saved through this extension, most recent first."
      onDismiss={onDismiss}
      showCloseButton={false}
    />
    <div className="history-dialog-content flex-column flex-grow">
      <HistoryContent />
    </div>
    <PanelFooter
      buttonProps={[
        {
          text: 'Close',
          onClick: onDismiss,
          primary: true,
        },
      ]}
    />
  </CustomDialog>
);
