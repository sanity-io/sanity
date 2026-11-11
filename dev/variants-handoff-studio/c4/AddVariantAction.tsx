import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {VariantDiamond} from '../c1/dimensionIcons'
import {useVariantDefinitions} from '../c1/world'
import {requestCreateMode} from './inventory/CreateVersion'

/** The inspector the inventory opens in (c4/InventoryInspector.tsx). */
const INVENTORY = 'variants-inventory'

/**
 * Add variant, in the document's action menu right after Publish (27 Oct, Faheem). It opens the version inventory in Create version mode, where
 * the editor picks the variant and the version it goes in: the menu entry is a way in, the create itself stays in one place. Shown while any
 * variant is defined, as the Variants pill is.
 */
export const AddVariantAction: DocumentActionComponent = (
  props,
): DocumentActionDescription | null => {
  const definitions = useVariantDefinitions()
  const {closeInspector, inspector, openInspector} = useDocumentPane()
  if (!definitions.length) return null
  return {
    icon: VariantDiamond,
    label: 'Add variant',
    onHandle: () => {
      requestCreateMode(props.id)
      if (inspector?.name !== INVENTORY) {
        openInspector(INVENTORY)
        return
      }
      // Already open: it is closed and opened again on the next frame, so it mounts afresh and reads the request.
      closeInspector(INVENTORY)
      requestAnimationFrame(() => openInspector(INVENTORY))
    },
  }
}
