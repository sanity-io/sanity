import {useBoundaryElement} from '@sanity/ui'
import {useContext} from 'react'
import {EditDialogOuterBoundaryContext} from 'sanity/_singletons'

import {AUTOCOMPLETE_POPOVER_BOUNDARY} from '../inputs/referenceAutocompletePopoverBoundary'

/**
 * Pick the right Floating UI boundary for a reference autocomplete popover.
 *
 * Document pane installs a `BoundaryElementProvider` on the scroll container. When the reference
 * input is rendered inside that subtree we want to reuse that boundary so the popover is
 * constrained by the scroll container (respects the sticky pane header, version chips /
 * document actions, and the bottom footer).
 *
 * Edit dialogs and PTE annotation popovers install a nested `BoundaryElementProvider` on their
 * own scroll box. Constraining autocomplete results to that box leaves only ~one row of height
 * (SAPP-4329). Prefer the boundary captured by `EditDialogOuterBoundaryProvider` when it still
 * contains the input; otherwise fall back to {@link AUTOCOMPLETE_POPOVER_BOUNDARY} (the document
 * root) so portaled popovers can use the viewport. Same overflow exception as the array insert
 * menu.
 *
 * Portaled dialogs (e.g. the Media Library, Create-new document) render outside the document
 * pane's scroll container, so the inherited context element no longer contains the reference
 * input. In that case fall back to {@link AUTOCOMPLETE_POPOVER_BOUNDARY} so the popover is
 * anchored against the viewport.
 *
 * Shared by same-dataset, cross-dataset, and global-document reference autocompletes.
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

  // Prefer the nearest `BoundaryElementProvider` element when it actually contains the reference
  // element in the DOM (typically the document pane scroll container).
  if (contextElement && referenceElement && contextElement.contains(referenceElement)) {
    return contextElement
  }

  return AUTOCOMPLETE_POPOVER_BOUNDARY ?? null
}
