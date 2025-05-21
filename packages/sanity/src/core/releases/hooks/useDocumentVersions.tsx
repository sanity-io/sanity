import {useEffect, useMemo, useState} from 'react'
import {map, type Observable, of, shareReplay} from 'rxjs'
import {catchError} from 'rxjs/operators'

import {useDataset} from '../../hooks/useDataset'
import {useProjectId} from '../../hooks/useProjectId'
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

// Create a singleton cache for observables
export const observableCache = new Map<string, Observable<DocumentPerspectiveState>>()

const swr = createSWR<{documentIds: string[]}>({maxSize: 100})

const INITIAL_VALUE = {
  data: [],
  error: null,
  loading: true,
}

function createObservable(
  documentPreviewStore: any,
  publishedId: string,
): Observable<DocumentPerspectiveState> {
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
      shareReplay({refCount: true, bufferSize: 1}),
    )
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
  const publishedId = getPublishedId(documentId)

  const dataset = useDataset()
  const projectId = useProjectId()
  const documentPreviewStore = useDocumentPreviewStore()
  const [results, setResults] = useState<DocumentPerspectiveState>(INITIAL_VALUE)
  const cacheId = `${projectId}-${dataset}-${publishedId}`

  const observable = useMemo(() => {
    const cachedObservable = observableCache.get(cacheId)
    if (cachedObservable) {
      return cachedObservable
    }

    const newObservable = createObservable(documentPreviewStore, cacheId)
    observableCache.set(cacheId, newObservable)
    return newObservable
  }, [cacheId, documentPreviewStore])

  useEffect(() => {
    const subscription = observable.subscribe((result) => {
      setResults(result)
    })
    return () => subscription.unsubscribe()
  }, [observable])

  return results
}
