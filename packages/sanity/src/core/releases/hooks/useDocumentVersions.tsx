import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'
import {catchError, scan} from 'rxjs/operators'

import {type ReleaseDocument, useDocumentPreviewStore, useReleases} from '../../store'
import {getPublishedId, getVersionFromId} from '../../util/draftUtils'
import {getBundleIdFromReleaseId} from '../util/getBundleIdFromReleaseId'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: ReleaseDocument[]
  error?: unknown
  loading: boolean
}

const INITIAL_STATE: DocumentPerspectiveState = {
  loading: true,
  error: null,
  data: [],
}

/**
 * Fetches the document versions for a given document
 * @param props - document Id of the document (might include release id)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props

  const {data: releases} = useReleases()
  const publishedId = getPublishedId(documentId)

  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(() => {
    return documentPreviewStore
      .unstable_observeDocumentIdSet(`sanity::versionOf("${publishedId}")`)
      .pipe(
        map(({documentIds}) => {
          return documentIds.flatMap((id) => {
            const matchingBundle = releases?.find(
              // eslint-disable-next-line max-nested-callbacks
              (release) => getVersionFromId(id) === getBundleIdFromReleaseId(release._id),
            )
            return matchingBundle || []
          })
        }),
        map((data) => ({data})),
        catchError((error) => {
          return of({error})
        }),
        scan((state, result) => {
          return {...state, ...result}
        }, INITIAL_STATE),
      )
  }, [releases, documentPreviewStore, publishedId])

  return useObservable(observable, INITIAL_STATE)
}
