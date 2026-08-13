import { MessageCard, MessageCardSeverity } from 'azure-devops-ui/MessageCard';

const toMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/** Standard error surface for a failed data load, with an optional retry. */
export const ErrorMessage = ({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) => (
  <MessageCard
    severity={MessageCardSeverity.Error}
    className="margin-16"
    buttonProps={
      onRetry
        ? [{ text: 'Retry', onClick: onRetry }]
        : undefined
    }
  >
    {toMessage(error)}
  </MessageCard>
);
