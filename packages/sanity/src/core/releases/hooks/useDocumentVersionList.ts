import {useMemo} from 'react'

import {getVersionFromId, isVersionId} from '../../util/draftUtils'
import {type ReleaseDocument, type ReleaseType} from '../store/types'
import {useActiveReleases} from '../store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {useDocumentVersions} from './useDocumentVersions'

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

interface useDocumentVersionListState {
  sortedDocumentList: ReleaseDocument[]
  onlyHasVersions: boolean
}

/**
 * Fetches the document versions for a given document and sorts them by release type
 * Returns a boolean if the document has only versions
 *
 * @param documentId - document id related to the document version list
 * @returns object with sortedDocumentList and if the document has only versions
 *
 * @beta
 */
export const useDocumentVersionList = ({
  documentId,
}: {
  documentId: string
}): useDocumentVersionListState => {
  const {data: releases} = useActiveReleases()
  const {data: documentVersions} = useDocumentVersions({documentId})

  const sortedDocumentList = releases
    .filter(({_id}) => {
      return documentVersions.some(
        (id) => getVersionFromId(id) === getReleaseIdFromReleaseDocumentId(_id),
      )
    })
    .sort((a, b) => {
      return (
        orderedReleaseTypes.indexOf(a.metadata.releaseType) -
        orderedReleaseTypes.indexOf(b.metadata.releaseType)
      )
    })

  const onlyHasVersions =
    documentVersions &&
    documentVersions.length > 0 &&
    !documentVersions.some((version) => !isVersionId(version))

  return useMemo(
    () => ({
      /**
       * Sorted document list by existing document versions and release type
       */
      sortedDocumentList: sortedDocumentList,
      onlyHasVersions,
    }),
    [sortedDocumentList, onlyHasVersions],
  )
}
