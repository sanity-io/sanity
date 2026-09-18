import {useContext} from 'react'
import {PerspectiveActiveDocumentContext} from 'sanity/_singletons'

import {type PerspectiveActiveDocumentContextValue} from './types'

const NO_ACTIVE_DOCUMENT: PerspectiveActiveDocumentContextValue = {
  activeDocument: null,
  setActiveDocument: () => undefined,
}

/**
 * Reads the selected document, if anything is publishing one.
 *
 * Returns a null `activeDocument` rather than throwing when no provider is
 * mounted. That is the load-bearing case, not an edge case: the provider is
 * registered by the variants plugin, so with `beta.variants.enabled` off nothing
 * publishes, and every consumer must fall back to its document-unaware layout.
 * The same applies outside the structure tool, where no pane exists to publish
 * from.
 *
 * @internal
 */
export function usePerspectiveActiveDocument(): PerspectiveActiveDocumentContextValue {
  return useContext(PerspectiveActiveDocumentContext) ?? NO_ACTIVE_DOCUMENT
}
