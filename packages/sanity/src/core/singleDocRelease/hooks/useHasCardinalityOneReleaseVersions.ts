import {useMemo} from 'react'

import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {type VariantId} from '../../variants/types'

/**
 * Checks if a document has any versions in scheduled draft (`metadata.cardinality: 'one'`) releases.
 *
 * Versions are matched by `_system`, not by id: variant versions have opaque ids whose bundle
 * segment is not the release id.
 *
 * @param documentId - The ID of the document to check
 * @param variantId - The variant document id (`_.variants.<name>`) whose versions are checked, or
 * `undefined` for the versions outside any variant
 * @returns `hasCardinalityOneReleaseVersions`: true if the document has versions in any cardinality
 * one releases. `loading`: true until the releases and the document's version stubs have loaded;
 * until then `hasCardinalityOneReleaseVersions` is false even when such a version exists.
 * @internal
 */
export function useHasCardinalityOneReleaseVersions(
  documentId: string,
  variantId?: VariantId,
): {hasCardinalityOneReleaseVersions: boolean; loading: boolean} {
  const {data: allReleases, loading: releasesLoading} = useActiveReleases()
  const {versions, loading: versionsLoading} = useDocumentVersions({documentId})

  const hasCardinalityOneReleaseVersions = useMemo(() => {
    if (!allReleases || !versions) return false

    const documentReleaseIds = new Set(
      versions
        .filter((version) => getDocumentVersionVariantId(version) === variantId)
        .map((version) => version._system.bundleId)
        .filter(Boolean),
    )

    return allReleases.some((release) => {
      const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

      return documentReleaseIds.has(releaseId) && isCardinalityOneRelease(release)
    })
  }, [allReleases, versions, variantId])

  return {hasCardinalityOneReleaseVersions, loading: releasesLoading || versionsLoading}
}
