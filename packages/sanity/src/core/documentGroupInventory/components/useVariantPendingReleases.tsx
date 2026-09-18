import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {getSystemVariantId} from '../../util/getSystemVariantRef'

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
  const versionsOfThisVariant = versions.filter((version) => {
    const versionVariantRef = getSystemVariantId(version._system)
    return variantRef ? versionVariantRef === variantRef : !versionVariantRef
  })
  const releasesOfThisVariant = versionsOfThisVariant.map(
    (version) => version._system.release?._ref,
  )

  return releases.filter((release) => !releasesOfThisVariant.includes(release._id))
}
