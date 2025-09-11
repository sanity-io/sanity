import {useMemo} from 'react'

import {getVersionFromId} from '../../util/draftUtils'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {useActiveReleases} from '../store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {useDocumentVersions} from './useDocumentVersions'

/**
 * Checks if a document has any versions in scheduled draft (cardinality one) releases.
 *
 * @param documentId - The ID of the document to check
 * @returns boolean - true if the document has versions in any cardinality one releases
 * @internal
 */
export function useHasCardinalityOneReleaseVersions(documentId: string): boolean {
  const {data: allReleases} = useActiveReleases()
  const {data: documentVersions} = useDocumentVersions({documentId})

  return useMemo(() => {
    if (!allReleases || !documentVersions) return false

    const documentReleaseIds = documentVersions.map(getVersionFromId)

    return allReleases.some((release) => {
      const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

      return documentReleaseIds.includes(releaseId) && isCardinalityOneRelease(release)
    })
  }, [allReleases, documentVersions])
}
