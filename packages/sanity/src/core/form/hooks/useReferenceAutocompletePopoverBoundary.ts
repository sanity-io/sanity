import {useBoundaryElement} from '@sanity/ui'
import {useContext} from 'react'
import {EditDialogOuterBoundaryContext} from 'sanity/_singletons'

import {AUTOCOMPLETE_POPOVER_BOUNDARY} from '../inputs/referenceAutocompletePopoverBoundary'

/**
 * Floating UI boundary for a reference autocomplete popover.
 *
 * Prefer the edit-dialog outer boundary when present so results can overflow the dialog's own
 * scroll box. If that element does not contain the input (portaled dialogs), use the document
 * root — using the pane would mark the reference `referenceHidden`. Otherwise reuse the nearest
 * `BoundaryElementProvider` that contains the input.
 *
 * @internal
 */
export function useReferenceAutocompletePopoverBoundary(
  referenceElement: HTMLElement | null,
): HTMLElement | null {
  const {element: contextElement} = useBoundaryElement()
  const editDialogOuterBoundary = useContext(EditDialogOuterBoundaryContext)

  if (editDialogOuterBoundary) {
    if (
      editDialogOuterBoundary.element &&
      referenceElement &&
      editDialogOuterBoundary.element.contains(referenceElement)
    ) {
      return editDialogOuterBoundary.element
    }
    return AUTOCOMPLETE_POPOVER_BOUNDARY ?? null
  }

  if (contextElement && referenceElement && contextElement.contains(referenceElement)) {
    return contextElement
  }

  return AUTOCOMPLETE_POPOVER_BOUNDARY ?? null
}
