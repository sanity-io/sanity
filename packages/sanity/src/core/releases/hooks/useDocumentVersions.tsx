import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'
import {catchError} from 'rxjs/operators'

import {useDocumentPreviewStore} from '../../store'
import {getPublishedId, getVersionFromId} from '../../util/draftUtils'
import {createSWR} from '../../util/rxSwr'
import {type ReleaseDocument, useActiveReleases} from '../store'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: ReleaseDocument[]
  error?: unknown
  loading: boolean
}

const swr = createSWR<{documentIds: string[]}>({maxSize: 100})

/**
 * Fetches the document versions for a given document
 * @param props - document Id of the document (might include release id)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props

  const {data: releases} = useActiveReleases()
  const publishedId = getPublishedId(documentId)

  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(() => {
    return documentPreviewStore
      .unstable_observeDocumentIdSet(`sanity::versionOf("${publishedId}")`)
      .pipe(
        swr(`${publishedId}`),
        map(({value}) => ({
          documentIds: value.documentIds,
          loading: false,
          error: null,
        })),
        catchError((error) => {
          return of({error, documentIds: [] as string[], loading: false})
        }),
      )
  }, [documentPreviewStore, publishedId])

  const result = useObservable(observable, {
    documentIds: [] as string[],
    error: null,
    loading: true,
  })
  const filterData = useMemo(
    () =>
      result.documentIds.flatMap((docId) => {
        const matchingBundle = releases?.find(
          (release) => getVersionFromId(docId) === getReleaseIdFromReleaseDocumentId(release._id),
        )
        return matchingBundle || []
      }),
    [releases, result.documentIds],
  )

  return useMemo(
    () => ({data: filterData, loading: result.loading, error: result.error}),
    [filterData, result],
  )
}
