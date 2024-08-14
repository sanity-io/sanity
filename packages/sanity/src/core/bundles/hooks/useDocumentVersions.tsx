import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'
import {catchError, scan} from 'rxjs/operators'
import {
  type BundleDocument,
  getBundleSlug,
  getPublishedId,
  useBundles,
  useDocumentPreviewStore,
} from 'sanity'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: BundleDocument[]
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
 * @param props - document Id of the document (might include bundle slug)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props

  const {data: bundles} = useBundles()
  const publishedId = getPublishedId(documentId)

  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(() => {
    return documentPreviewStore
      .unstable_observeDocumentIdSet(`_id in path("versions.**") && _id match '*.${publishedId}'`)
      .pipe(
        map(({documentIds}) => {
          return documentIds.flatMap((id) => {
            // eslint-disable-next-line max-nested-callbacks
            const matchingBundle = bundles?.find((bundle) => getBundleSlug(id) === bundle.slug)
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
  }, [bundles, documentPreviewStore, publishedId])

  return useObservable(observable, INITIAL_STATE)
}
