import { Button } from 'azure-devops-ui/Button';
import { IconSize, type IIconProps } from 'azure-devops-ui/Icon';

/**
 * Variable-type icon name. `null` means a matrix row whose cells disagree on
 * secrecy (mixed); plain rows are always `true`/`false`.
 */
export const secretIconName = (isSecret: boolean | null): string =>
  isSecret == null
    ? 'fluent-WarningColor'
    : isSecret
      ? 'fluent-KeyRegular'
      : 'fluent-MathFormulaRegular';

/** Icon props for the name cell of a variable, including the mixed-secret hint. */
export const secretNameIconProps = (isSecret: boolean | null): IIconProps => ({
  iconName: secretIconName(isSecret),
  style: { paddingLeft: 0, marginLeft: 0 },
  size: IconSize.medium,
  tooltipProps:
    isSecret == null ? { text: 'Variable has mixed secret types' } : undefined,
});

/** Lock/Unlock button that flips a variable between secret and plain text.
 * A `null` (mixed-secret matrix row) reads as not-secret, matching the icon. */
export const SecretToggleButton = ({
  isSecret,
  onToggle,
}: {
  isSecret: boolean | null;
  onToggle: () => void;
}) => (
  <Button
    subtle
    iconProps={{ iconName: isSecret ? 'Lock' : 'Unlock' }}
    tooltipProps={{
      text: isSecret
        ? 'Change variable type to plain text'
        : 'Change variable type to secret',
    }}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onToggle}
  />
);
