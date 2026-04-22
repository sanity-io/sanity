import {useBoundaryElement} from '@sanity/ui'

import {AUTOCOMPLETE_POPOVER_BOUNDARY} from '../inputs/referenceAutocompletePopoverBoundary'

/**
 * Pick the right Floating UI boundary for a reference autocomplete popover.
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
  const {element: contextElement} = useBoundaryElement()

  // Prefer the nearest `BoundaryElementProvider` element when it actually contains the reference
  // element in the DOM (typically the document pane scroll container).
  if (contextElement && referenceElement && contextElement.contains(referenceElement)) {
    return contextElement
  }

  return AUTOCOMPLETE_POPOVER_BOUNDARY ?? null
}
