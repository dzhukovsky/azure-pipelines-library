import { MessageCard, MessageCardSeverity } from 'azure-devops-ui/MessageCard';
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | undefined };

/**
 * Catches render-time errors anywhere below it so a single throw shows a
 * message instead of blanking the whole Azure DevOps iframe.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: undefined };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Advanced Library crashed', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <MessageCard severity={MessageCardSeverity.Error} className="margin-16">
          Something went wrong: {this.state.error.message}
        </MessageCard>
      );
    }

    return this.props.children;
  }
}
