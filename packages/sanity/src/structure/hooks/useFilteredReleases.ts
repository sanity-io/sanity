import {useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getVersionFromId,
  type ReleaseDocument,
  useActiveReleases,
  useArchivedReleases,
  useDocumentVersions,
  usePerspective,
} from 'sanity'

import {usePaneRouter} from '../components/paneRouter/usePaneRouter'
import {type DocumentPaneContextValue} from '../panes/document/DocumentPaneContext'

type FilterReleases = {
  notCurrentReleases: ReleaseDocument[]
  currentReleases: ReleaseDocument[]
  inCreation: ReleaseDocument | null
}

/**
 * @internal
 */
export function useFilteredReleases({
  displayed,
  documentId,
}: Pick<DocumentPaneContextValue, 'displayed' | 'documentId'>): FilterReleases {
  const {selectedReleaseId} = usePerspective()
  const {data: releases} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()
  const {data: documentVersions} = useDocumentVersions({documentId})
  const isCreatingDocument = displayed && !displayed._createdAt
  const {params} = usePaneRouter()

  return useMemo(() => {
    if (!documentVersions) return {notCurrentReleases: [], currentReleases: [], inCreation: null}
    // Gets the releases ids from the document versions, it means, the releases that the document belongs to
    const releasesIds = documentVersions.map((id) => getVersionFromId(id))
    const activeReleases = releases.reduce(
      (acc: FilterReleases, release) => {
        const versionDocExists = releasesIds.includes(
          getReleaseIdFromReleaseDocumentId(release._id),
        )
        const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
        const isCreatingThisVersion =
          isCreatingDocument &&
          releaseId === getVersionFromId(displayed._id || '') &&
          releaseId === selectedReleaseId

        if (isCreatingThisVersion) {
          acc.inCreation = release
        } else if (versionDocExists) {
          acc.currentReleases.push(release)
        } else {
          acc.notCurrentReleases.push(release)
        }
        return acc
      },
      {notCurrentReleases: [], currentReleases: [], inCreation: null},
    )

    // without historyVersion, version is not in an archived release
    if (!params?.historyVersion) return activeReleases

    const archivedRelease = archivedReleases.find(
      (r) => getReleaseIdFromReleaseDocumentId(r._id) === params?.historyVersion,
    )

    // only for explicitly archived releases; published releases use published perspective
    if (archivedRelease?.state === 'archived') {
      activeReleases.currentReleases.push(archivedRelease)
    }

    return activeReleases
  }, [
    archivedReleases,
    isCreatingDocument,
    displayed?._id,
    documentVersions,
    params?.historyVersion,
    releases,
    selectedReleaseId,
  ])
}
