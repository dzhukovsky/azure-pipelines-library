import './index.scss';

import { Button } from 'azure-devops-ui/Button';
import { Icon, IconSize } from 'azure-devops-ui/Icon';
import { css } from 'azure-devops-ui/Util';

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
  renderAction,
  fullPage,
}: {
  iconName?: string;
  imagePath?: string;
  primaryText: string;
  secondaryText?: string;
  /** A simple primary button. Ignored when `renderAction` is set. */
  action?: EmptyStateAction;
  /** A custom action element (e.g. a split button) rendered in place of `action`. */
  renderAction?: () => JSX.Element;
  fullPage?: boolean;
}) => (
  <div
    className={css(
      'empty-state flex-grow flex-column flex-center justify-center',
      fullPage && 'empty-state--full',
    )}
  >
    <div className="empty-state-content flex-column flex-center text-center">
      {imagePath ? (
        <img
          className="empty-state-image margin-bottom-16"
          src={imagePath}
          alt=""
          width={120}
          height={120}
        />
      ) : (
        iconName && (
          <Icon
            className="margin-bottom-16"
            iconName={iconName}
            size={IconSize.large}
          />
        )
      )}
      <div className="title-l">{primaryText}</div>
      {secondaryText && (
        <div className="empty-state-secondary secondary-text margin-top-8">
          {secondaryText}
        </div>
      )}
      {(renderAction || action) && (
        <div className="margin-top-16">
          {renderAction
            ? renderAction()
            : action && (
                <Button
                  primary={true}
                  text={action.text}
                  onClick={action.onClick}
                />
              )}
        </div>
      )}
    </div>
  </div>
);
