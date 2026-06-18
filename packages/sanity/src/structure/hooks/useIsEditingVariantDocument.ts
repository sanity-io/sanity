import {isDocumentInSelectedVariant, useDocumentVersions, usePerspective} from 'sanity'

import {useDocumentPaneInfo} from '../panes/document/useDocumentPaneInfo'

/**
 * Returns true when a variant is selected and the open document has a variant-scoped
 * version for that variant in the current bundle (i.e. the user is editing a variant document).
 *
 * Temporary hook to check if the user is editing a variant document, this could be removed once we allow actions on variant documents.
 * Do not export this
 */
export function useIsEditingVariantDocument(): boolean {
  const {selectedVariant, bundle} = usePerspective()
  const {documentId} = useDocumentPaneInfo()
  const {versions, loading} = useDocumentVersions({documentId})

  if (!selectedVariant || loading) {
    return false
  }

  return isDocumentInSelectedVariant({
    selectedVariant,
    bundle,
    documentVersions: versions,
  })
}
