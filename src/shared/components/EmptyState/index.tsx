import './index.scss';

import { ZeroData, ZeroDataActionType } from 'azure-devops-ui/ZeroData';

export type EmptyStateAction = { text: string; onClick: () => void };

/** Centered zero-data placeholder for an empty tab, styled like the Azure
 * DevOps built-in empty states. Pass `imagePath` for an image (e.g. the logo)
 * or `iconName` for an icon glyph. */
export const EmptyState = ({
  iconName,
  imagePath,
  primaryText,
  secondaryText,
  action,
}: {
  iconName?: string;
  imagePath?: string;
  primaryText: string;
  secondaryText?: string;
  action?: EmptyStateAction;
}) => (
  <div className="empty-state flex-grow flex-column">
    <ZeroData
      className="empty-state-content"
      imageAltText=""
      imagePath={imagePath}
      iconProps={iconName ? { iconName } : undefined}
      primaryText={primaryText}
      secondaryText={secondaryText}
      {...(action && {
        actionText: action.text,
        actionType: ZeroDataActionType.ctaButton,
        onActionClick: action.onClick,
      })}
    />
  </div>
);
