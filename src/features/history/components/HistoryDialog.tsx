import './HistoryDialog.scss';

import { useQueryClient } from '@tanstack/react-query';
import { CustomDialog } from 'azure-devops-ui/Dialog';
import { TitleSize } from 'azure-devops-ui/Header';
import { PanelFooter, PanelHeader } from 'azure-devops-ui/Panel';
import { useState } from 'react';
import { clearHistoryEntries } from '../api/historyStorage';
import { historyQueryKey } from '../hooks/useHistory';
import { HistoryContent } from './HistoryContent';

export interface IHistoryDialogProps {
  onDismiss: () => void;
}

export const HistoryDialog = ({ onDismiss }: IHistoryDialogProps) => {
  const queryClient = useQueryClient();
  // TEMP: manual one-off cleanup of old history. Remove this state, the
  // handler and the "Clear history" footer button once the purge is done.
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const onClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true); // first click arms it
      return;
    }
    setClearing(true);
    await clearHistoryEntries();
    await queryClient.invalidateQueries({ queryKey: historyQueryKey });
    setClearing(false);
    setConfirmClear(false);
  };

  return (
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
          // TEMP: manual history cleanup button — remove once old history is purged.
          {
            text: clearing
              ? 'Clearing…'
              : confirmClear
                ? 'Confirm — clear all history?'
                : 'Clear history',
            onClick: onClear,
            danger: true,
            disabled: clearing,
          },
          {
            text: 'Close',
            onClick: onDismiss,
            primary: true,
          },
        ]}
      />
    </CustomDialog>
  );
};
