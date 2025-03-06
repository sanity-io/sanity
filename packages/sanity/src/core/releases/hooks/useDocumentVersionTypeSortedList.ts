import {useMemo} from 'react'

import {getVersionFromId} from '../../util/draftUtils'
import {type ReleaseDocument, type ReleaseType} from '../store/types'
import {useActiveReleases} from '../store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {useDocumentVersions} from './useDocumentVersions'

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

export interface useDocumentVersionTypeSortedListState {
  sortedDocumentList: ReleaseDocument[]
}

/**
 * Fetches the document versions for a given document and sorts them by release type
 *
 * @param documentId - document id related to the document version list
 * @returns object with sortedDocumentList
 *
 * @beta
 */
export const useDocumentVersionTypeSortedList = ({
  documentId,
}: {
  documentId: string
}): useDocumentVersionTypeSortedListState => {
  const {data: releases} = useActiveReleases()
  const {data: documentVersions} = useDocumentVersions({documentId})

  const sortedDocumentList = releases
    .filter(({_id}) => {
      return documentVersions.some(
        (id) => getVersionFromId(id) === getReleaseIdFromReleaseDocumentId(_id),
      )
    })
    /**  sort the document lists that exist for a specific document Id based on the order of the release types
     * it will first put the "asap" releases then "scheduled" and finally "undecided"
     * orderedReleaseTypes is the order of the release types
     * */
    .sort((releasesList, compareReleasesList) => {
      // reverse order of published at / intended to publish at
      if (
        releasesList.metadata.releaseType === 'scheduled' &&
        compareReleasesList.metadata.releaseType === 'scheduled'
      ) {
        const aPublishAt = releasesList.publishAt || releasesList.metadata.intendedPublishAt
        if (!aPublishAt) {
          return -1
        }
        const bPublishAt =
          compareReleasesList.publishAt || compareReleasesList.metadata.intendedPublishAt
        if (!bPublishAt) {
          return 1
        }
        return new Date(aPublishAt).getTime() - new Date(bPublishAt).getTime()
      }

      return (
        orderedReleaseTypes.indexOf(releasesList.metadata.releaseType) -
        orderedReleaseTypes.indexOf(compareReleasesList.metadata.releaseType)
      )
    })

  return useMemo(
    () => ({
      /**
       * Sorted document list by existing document versions and release type
       */
      sortedDocumentList: sortedDocumentList,
    }),
    [sortedDocumentList],
  )
}
