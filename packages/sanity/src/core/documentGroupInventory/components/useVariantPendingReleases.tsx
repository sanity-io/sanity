import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {type VariantId} from '../../variants/types'

interface Options {
  documentId: string
  variantId: VariantId | undefined
}
/**
 * Finds the releases a variant hasn't been added to yet.
 */
export function useVariantPendingReleases({documentId, variantId}: Options) {
  const {versions} = useDocumentVersions({documentId})
  const {data: releases} = useActiveReleases()
  const versionsOfThisVariant = versions.filter((version) => {
    const versionVariantRef = getDocumentVersionVariantId(version)
    return variantId ? versionVariantRef === variantId : !versionVariantRef
  })
  const releasesOfThisVariant = versionsOfThisVariant.map(
    (version) => version._system.release?._ref,
  )

  return releases.filter((release) => !releasesOfThisVariant.includes(release._id))
}
