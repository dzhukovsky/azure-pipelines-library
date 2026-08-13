import './index.scss';

import { css } from 'azure-devops-ui/Util';
import { ZeroData, ZeroDataActionType } from 'azure-devops-ui/ZeroData';

export type EmptyStateAction = { text: string; onClick: () => void };

/** Centered zero-data placeholder for an empty tab, styled like the Azure
 * DevOps built-in empty states. Pass `imagePath` for an image (e.g. the logo)
 * or `iconName` for an icon glyph. `fullPage` centers it in the whole surface
 * (no header/tab chrome above it). */
export const EmptyState = ({
  iconName,
  imagePath,
  primaryText,
  secondaryText,
  action,
  fullPage,
}: {
  iconName?: string;
  imagePath?: string;
  primaryText: string;
  secondaryText?: string;
  action?: EmptyStateAction;
  fullPage?: boolean;
}) => (
  <div
    className={css(
      'empty-state flex-grow flex-column',
      fullPage && 'empty-state--full',
    )}
  >
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
