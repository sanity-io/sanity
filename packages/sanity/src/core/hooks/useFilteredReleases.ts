import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument, type StrictVersionLayeringOptions} from '@sanity/types'

import {usePerspective} from '../perspective/usePerspective'
import {useDocumentVersions} from '../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {useArchivedReleases} from '../releases/store/useArchivedReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {getDocumentIsInPerspective} from '../releases/util/util'
import {getVersionFromId} from '../util/draftUtils'

type FilterReleases = {
  notCurrentReleases: ReleaseDocument[]
  currentReleases: ReleaseDocument[]
  inCreation: ReleaseDocument | null
}

interface Options extends StrictVersionLayeringOptions {
  displayed: Partial<SanityDocument> | null
  documentId: string
  historyVersion?: string
}

/**
 * @internal
 */
export function useFilteredReleases({
  displayed,
  documentId,
  strict,
  historyVersion,
}: Options): FilterReleases {
  const {selectedReleaseId} = usePerspective()
  const {data: releases} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()
  const {data: documentVersions} = useDocumentVersions({documentId})
  const isCreatingDocument = displayed && !displayed._createdAt

  if (!documentVersions) return {notCurrentReleases: [], currentReleases: [], inCreation: null}
  // Gets the releases ids from the document versions, it means, the releases that the document belongs to
  const releasesIds = documentVersions.map((id) => getVersionFromId(id))
  const activeReleases = releases.reduce(
    (acc: FilterReleases, release) => {
      const versionDocExists = releasesIds.includes(getReleaseIdFromReleaseDocumentId(release._id))
      const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
      const isCreatingThisVersion =
        isCreatingDocument &&
        releaseId === getVersionFromId(displayed._id || '') &&
        releaseId === selectedReleaseId

      if (isCreatingThisVersion) {
        acc.inCreation = release
      } else if (versionDocExists) {
        if (strict) {
          // In strict mode, only include the release if it contains the displayed version, or
          // if it's a scheduled release. This ensures layering reflects only the known
          // chronology of releases.
          //
          // For example, when viewing an ASAP version, it's impossible to know whether
          // some other ASAP version will be published first.
          if (
            getDocumentIsInPerspective(
              displayed?._id ?? '',
              getReleaseIdFromReleaseDocumentId(release._id),
            ) ||
            release.metadata.releaseType === 'scheduled'
          ) {
            acc.currentReleases.push(release)
          }
        } else {
          acc.currentReleases.push(release)
        }
      } else {
        acc.notCurrentReleases.push(release)
      }
      return acc
    },
    {notCurrentReleases: [], currentReleases: [], inCreation: null},
  )

  // without historyVersion, version is not in an archived release
  if (!historyVersion) return activeReleases

  const archivedRelease = archivedReleases.find(
    (r) => getReleaseIdFromReleaseDocumentId(r._id) === historyVersion,
  )

  // only for explicitly archived releases; published releases use published perspective
  if (archivedRelease?.state === 'archived') {
    activeReleases.currentReleases.push(archivedRelease)
  }

  return activeReleases
}
