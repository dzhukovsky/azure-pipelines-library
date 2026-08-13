import { Button } from 'azure-devops-ui/Button';
import { MenuButton } from 'azure-devops-ui/Menu';
import { goToNewSecureFile } from '@/features/secure-files/newSecureFile';
import { goToNewVariableGroup } from '@/features/variable-groups/newVariableGroup';

/** Primary "New variable group" plus a subtle "…" overflow menu for the other
 * things the native Library can create (secure files), the same MoreVertical
 * menu button the Home rows use. Shared by the page header and the empty-state
 * call to action. */
export const NewLibraryItemButton = () => (
  <div className="flex-row rhythm-horizontal-8">
    <Button
      primary={true}
      text="New variable group"
      onClick={goToNewVariableGroup}
    />
    <MenuButton
      subtle={true}
      hideDropdownIcon={true}
      ariaLabel="More library items"
      iconProps={{ iconName: 'MoreVertical' }}
      contextualMenuProps={{
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
      }}
    />
  </div>
);
