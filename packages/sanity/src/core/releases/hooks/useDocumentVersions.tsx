import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'
import {catchError} from 'rxjs/operators'

import {useDocumentPreviewStore} from '../../store'
import {getPublishedId} from '../../util/draftUtils'
import {createSWR} from '../../util/rxSwr'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: string[]
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

  const publishedId = getPublishedId(documentId)

  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(() => {
    return documentPreviewStore
      .unstable_observeDocumentIdSet(`sanity::versionOf("${publishedId}")`, undefined, {
        apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
      })
      .pipe(
        swr(`${publishedId}`),
        map(({value}) => ({
          data: value.documentIds,
          loading: false,
          error: null,
        })),
        catchError((error) => {
          return of({error, data: [] as string[], loading: false})
        }),
      )
  }, [documentPreviewStore, publishedId])

  const result = useObservable(observable, {data: [], error: null, loading: true})

  return result
}
