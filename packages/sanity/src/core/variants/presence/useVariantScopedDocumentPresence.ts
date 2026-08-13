import {useMemo} from 'react'

import {usePerspective} from '../../perspective/usePerspective'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {type DocumentPresence} from '../../store/presence/types'
import {useDocumentPresence} from '../../store/presence/useDocumentPresence'
import {filterPresenceByVariant, getVariantScopeIds} from './filterPresenceByVariant'

/**
 * Document presence for a document group, scoped to the selected variant.
 *
 * {@link useDocumentPresence} aggregates presence across every document in the group, which means
 * editors of different variants show up in the same place. This narrows that list to the variant
 * currently being viewed (or, when no variant is selected, to the base document and its release
 * versions).
 *
 * @param documentGroupId - The published id of the document group.
 *
 * @internal
 */
export function useVariantScopedDocumentPresence(documentGroupId: string): DocumentPresence[] {
  const presence = useDocumentPresence(documentGroupId)
  const {versions} = useDocumentVersions({documentId: documentGroupId})
  const {selectedVariant} = usePerspective()

  const variantScopeIds = useMemo(() => getVariantScopeIds(versions), [versions])

  return useMemo(
    () =>
      filterPresenceByVariant({
        presence,
        selectedVariantId: selectedVariant?._id,
        variantScopeIds,
      }),
    [presence, selectedVariant?._id, variantScopeIds],
  )
}
