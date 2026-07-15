import {useBoundaryElement} from '@sanity/ui'
import {useContext} from 'react'
import {EditDialogBoundaryContext} from 'sanity/_singletons'

import {AUTOCOMPLETE_POPOVER_BOUNDARY} from '../inputs/referenceAutocompletePopoverBoundary'

/**
 * Pick the right Floating UI boundary for a reference autocomplete popover.
 *
 * Edit dialogs and modals (`EditPortal`, `EnhancedObjectDialog`, the Portable Text object
 * modals) expose their content element through {@link EditDialogBoundaryContext}. When the
 * reference input is rendered inside such a dialog we constrain the popover to it, so the list
 * doesn't extend under other studio UI. This is a dedicated context (rather than the generic
 * `BoundaryElementProvider`) so that other popovers inside dialogs — e.g. the array insert menu —
 * are not constrained by the dialog and keep using the ambient boundary.
 *
 * Document pane installs a `BoundaryElementProvider` on the scroll container. When the reference
 * input is rendered inside that subtree we want to reuse that boundary so the popover is
 * constrained by the scroll container (respects the sticky pane header, version chips /
 * document actions, and the bottom footer).
 *
 * Portaled dialogs (e.g. the Media Library, Create-new document) render outside the document
 * pane's scroll container, so the inherited context element no longer contains the reference
 * input. In that case fall back to {@link AUTOCOMPLETE_POPOVER_BOUNDARY} (the document root) so
 * the popover is anchored against the viewport.
 *
 * Shared by same-dataset, cross-dataset, and global-document reference autocompletes.
 *
 * @internal
 */
export function useReferenceAutocompletePopoverBoundary(
  referenceElement: HTMLElement | null,
): HTMLElement | null {
  const dialogBoundaryElement = useContext(EditDialogBoundaryContext)
  const {element: contextElement} = useBoundaryElement()

  // Prefer the containing edit dialog / modal when the reference element is rendered inside one.
  if (
    dialogBoundaryElement &&
    referenceElement &&
    dialogBoundaryElement.contains(referenceElement)
  ) {
    return dialogBoundaryElement
  }

  // Otherwise prefer the nearest `BoundaryElementProvider` element when it actually contains the
  // reference element in the DOM (typically the document pane scroll container).
  if (contextElement && referenceElement && contextElement.contains(referenceElement)) {
    return contextElement
  }

  return AUTOCOMPLETE_POPOVER_BOUNDARY ?? null
}
