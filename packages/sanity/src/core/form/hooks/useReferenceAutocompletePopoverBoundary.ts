import {useBoundaryElement} from '@sanity/ui'

import {usePortalBoundary} from '../../components/portalBoundary/usePortalBoundary'
import {AUTOCOMPLETE_POPOVER_BOUNDARY} from '../inputs/referenceAutocompletePopoverBoundary'

/**
 * Floating UI boundary for a reference autocomplete popover (used as both `floatingBoundary` and
 * `referenceBoundary`), in order of preference:
 *
 * 1. The boundary declared by the hosting surface through `PortalBoundaryProvider` — the document
 *    pane declares its scroll container. It wins regardless of where the input sits in the DOM:
 *    dialogs and Portable Text object popovers are portaled, so no containment test can find
 *    the pane from inside them, and dialogs must not shadow it with their own scroll box. Results
 *    may escape the dialog but stay between the pane header and footer (#14661, #14726).
 * 2. Otherwise the ambient `BoundaryElementProvider`, when it actually contains the input.
 * 3. Otherwise the document root, so a popover in a body-portaled dialog (Media Library,
 *    create-new document) is positioned against the viewport instead of being marked hidden.
 *
 * Shared by same-dataset, cross-dataset, and global-document reference autocompletes.
 *
 * @internal
 */
export function useReferenceAutocompletePopoverBoundary(
  referenceElement: HTMLElement | null,
): HTMLElement | null {
  const portalBoundary = usePortalBoundary()
  const {element: contextElement} = useBoundaryElement()

  if (portalBoundary) {
    return portalBoundary
  }

  if (contextElement && referenceElement && contextElement.contains(referenceElement)) {
    return contextElement
  }

  return AUTOCOMPLETE_POPOVER_BOUNDARY ?? null
}
