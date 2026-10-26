import {DocumentsIcon} from '@sanity/icons/Documents'
import {useDocumentPane} from 'sanity/structure'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'

/** The inspector the inventory opens in (c4/InventoryInspector.tsx). */
const INVENTORY = 'variants-inventory'

/**
 * T4, the entry to the version inventory: a text button, "Manage versions", with the versions icon, first in the pane header's right-hand group
 * (after the presence avatars). It opens and closes the inventory, and is pressed while it is open. It replaces the icon-only Versions button,
 * which said nothing about what it opens (26 Oct, Faheem). The "..." menu still lists Versions.
 */
export function ManageVersionsButton() {
  const {closeInspector, inspector, openInspector} = useDocumentPane()
  const open = inspector?.name === INVENTORY
  return (
    <Button
      data-testid="manage-versions"
      icon={DocumentsIcon}
      mode="bleed"
      onClick={() => (open ? closeInspector(INVENTORY) : openInspector(INVENTORY))}
      selected={open}
      text="Manage versions"
    />
  )
}
