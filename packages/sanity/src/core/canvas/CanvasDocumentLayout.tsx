import {createContext, useContext, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, type Observable, of, retry, startWith} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {type DocumentLayoutProps} from '../config/types'
import {useClient} from '../hooks/useClient'
import {useDocumentPreviewStore} from '../store/_legacy/datastores'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {getPublishedId} from '../util/draftUtils'
import {type CompanionDoc} from './types'

const CanvasContext = createContext<{
  companionDocs: CompanionDocs
} | null>(null)

const INITIAL_VALUE: CompanionDocs = {
  data: [],
  error: null,
  loading: true,
}

interface CompanionDocs {
  data: CompanionDoc[]
  error: null | string
  loading: boolean
}

export function CanvasDocumentLayout(props: DocumentLayoutProps) {
  const documentPreviewStore = useDocumentPreviewStore()
  const {documentId} = props
  const publishedId = getPublishedId(documentId)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const companionDocs$: Observable<CompanionDocs> = useMemo(() => {
    const companionDocsIdsListener$ = (id: string) =>
      documentPreviewStore.unstable_observeDocumentIdSet(
        `_type == "sanity.canvas.link" && (
            studioDocumentId in path("versions.**."+ $publishedId) || 
            studioDocumentId in [$publishedId, "drafts." + $publishedId]
          )`,
        {publishedId: id},
      )

    const getCompanionDoc$ = (id: string) =>
      client.observable
        .fetch<CompanionDoc>(
          `*[_id == $id][0]{ _id, canvasDocumentId, studioDocumentId}`,
          {id},
          {tag: 'canvas-document-layout.companion-docs'},
        )
        .pipe(
          map((response) => {
            if (!response._id) {
              // This will be caught by the retry operator below
              // In some race scenarios we can get the response in the listener before the document is available to be fetched.
              // this is a workaround to retry the request until the document is available, we know it should be available because the listener got it
              throw new Error('Companion doc not ready')
            }
            return response
          }),
          retry({count: 2, delay: 1000}),
        )

    return companionDocsIdsListener$(publishedId).pipe(
      map((value) => value.documentIds),
      mergeMapArray(getCompanionDoc$),
      map((value) => ({error: null, data: value, loading: false})),
      catchError((error) => of({error, data: [], loading: false})),
      startWith(INITIAL_VALUE),
    )
  }, [documentPreviewStore, publishedId, client])

  const companionDocs = useObservable(companionDocs$, INITIAL_VALUE)

  return (
    <CanvasContext.Provider value={{companionDocs}}>
      {props.renderDefault(props)}
    </CanvasContext.Provider>
  )
}

export function useCanvasContext() {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasDocumentLayout')
  }
  return context
}
