import {getPublishedId} from '@sanity/client/csm'
import {useMemo} from 'react'

import {usePerspective} from '../perspective/usePerspective'
import {isReleaseDocument} from '../releases/store/types'
import {type DocumentTarget} from '../store/document/document/types'

export function useDocumentTarget(documentId: string): DocumentTarget {
  const {selectedPerspective} = usePerspective()

  return useMemo(
    () => ({
      baseId: getPublishedId(documentId),
      bundleId: isReleaseDocument(selectedPerspective)
        ? selectedPerspective._id
        : selectedPerspective,
      variantId: undefined,
    }),
    [documentId, selectedPerspective],
  )
}
