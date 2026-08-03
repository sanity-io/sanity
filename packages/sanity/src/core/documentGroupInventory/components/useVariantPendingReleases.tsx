import {useMemo} from 'react'

import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'

interface Options {
  documentId: string
  variantRef: string | undefined
}
/**
 * Finds the releases a variant hasn't been added to yet.
 */
export function useVariantPendingReleases({documentId, variantRef}: Options) {
  const {versions} = useDocumentVersions({documentId})
  const {data: releases} = useActiveReleases()

  return useMemo(() => {
    const releasesOfThisVariant = new Set(
      versions
        .filter((version) =>
          variantRef
            ? version._system.variant?._ref === variantRef
            : !version._system.variant?._ref,
        )
        .map((version) => version._system.release?._ref),
    )

    return releases.filter((release) => !releasesOfThisVariant.has(release._id))
  }, [releases, variantRef, versions])
}
