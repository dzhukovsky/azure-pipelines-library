import { SplitButton } from 'azure-devops-ui/SplitButton';
import { goToNewSecureFile } from '@/features/secure-files/newSecureFile';
import { goToNewVariableGroup } from '@/features/variable-groups/newVariableGroup';

/** Primary "New variable group" with a menu for the other things the native
 * Library can create (secure files). Shared by the page header and the
 * empty-state call to action. */
export const NewLibraryItemButton = () => (
  <SplitButton
    primary={true}
    buttonProps={{
      text: 'New variable group',
      onClick: goToNewVariableGroup,
    }}
    menuButtonProps={{
      ariaLabel: 'More library items',
      contextualMenuProps: {
        menuProps: {
          id: 'new-library-item-menu',
          items: [
            {
              id: 'new-secure-file',
              text: 'New secure file',
              onActivate: goToNewSecureFile,
            },
          ],
        },
      },
    }}
  />
);
