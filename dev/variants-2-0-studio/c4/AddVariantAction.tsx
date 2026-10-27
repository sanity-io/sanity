import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {VariantDiamond} from '../c1/dimensionIcons'
import {useVariantDefinitions} from '../c1/world'
import {useOption} from '../options/store'
import {INVENTORY_INSPECTOR, requestCreateMode} from './inventory/CreateVersion'

/**
 * Add variant, in the document's action menu right after Publish (27 Oct, Faheem; ported from the Handoff Studio's 0f62e9fc51). It opens the
 * version inventory in Create version mode, where the editor picks the variant and the version it goes in: the menu entry is a way in, the
 * create itself stays in one place. Shown with C13 B while any variant is defined, as the Variants pill is. The Create version mode is the
 * C4 E inventory's (Open beta (locked) uses it); with another C4 option the inventory opens as that option draws it.
 */
export const AddVariantAction: DocumentActionComponent = (
  props,
): DocumentActionDescription | null => {
  const definitions = useVariantDefinitions()
  const {closeInspector, inspector, openInspector} = useDocumentPane()
  const option = useOption('c13')
  if (option !== 'b' || !definitions.length) return null
  return {
    icon: VariantDiamond,
    label: 'Add variant',
    onHandle: () => {
      requestCreateMode(props.id)
      if (inspector?.name !== INVENTORY_INSPECTOR) {
        openInspector(INVENTORY_INSPECTOR)
        return
      }
      // Already open: it is closed and opened again on the next frame, so it mounts afresh and reads the request.
      closeInspector(INVENTORY_INSPECTOR)
      requestAnimationFrame(() => openInspector(INVENTORY_INSPECTOR))
    },
  }
}
