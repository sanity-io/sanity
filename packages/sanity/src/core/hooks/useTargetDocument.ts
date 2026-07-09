import {useMemo} from 'react'

import {usePerspective} from '../perspective/usePerspective'
import {useDocumentVersions} from '../releases'
import {getTargetDocument} from '../util/getTargetDocument'

/**
 * @internal
 * @beta
 *
 * Provided a document group id and using the selected perspective and variant
 * it will return the target document if it exists, otherwise it will return undefined.
 */
export function useTargetDocument(documentGroupId: string) {
  const {versions: documentVersionStubs} = useDocumentVersions({documentId: documentGroupId})
  const {bundle, selectedVariant} = usePerspective()

  const targetDocument = useMemo(() => {
    return getTargetDocument({
      bundle,
      variant: selectedVariant?._id,
      documentVersions: documentVersionStubs,
    })
  }, [bundle, selectedVariant?._id, documentVersionStubs])
  return targetDocument
}
