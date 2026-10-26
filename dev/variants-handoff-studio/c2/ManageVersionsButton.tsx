import {DocumentsIcon} from '@sanity/icons/Documents'
import {useDocumentPane} from 'sanity/structure'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'

/** The inspector the inventory opens in (c4/InventoryInspector.tsx). */
const INVENTORY = 'variants-inventory'

/**
 * T4, the entry to the version inventory: a text button, "Manage versions", with the versions icon, first in the pane header's right-hand group
 * (after the presence avatars). It opens and closes the inventory: an outlined button, with the pressed look while the inventory is open. It replaces the icon-only Versions button,
 * which said nothing about what it opens (26 Oct, Faheem). The "..." menu still lists Versions.
 */
export function ManageVersionsButton() {
  const {closeInspector, inspector, openInspector} = useDocumentPane()
  const open = inspector?.name === INVENTORY
  return (
    <Button
      data-testid="manage-versions"
      icon={DocumentsIcon}
      // A button that looks like one (26 Oct, Faheem): outlined with no fill. While the inventory is open it takes the pressed look (the soft
      // grey fill of Studio's pressed buttons), not a filled primary: an open panel is a state, not an action, and the one filled button in view
      // stays the page's real action (Create version, Publish).
      aria-pressed={open}
      mode="ghost"
      onClick={() => (open ? closeInspector(INVENTORY) : openInspector(INVENTORY))}
      selected={open}
      text="Manage versions"
    />
  )
}
