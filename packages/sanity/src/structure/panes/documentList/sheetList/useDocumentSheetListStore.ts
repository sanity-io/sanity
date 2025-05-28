import {type ListenEvent, type ListenOptions} from '@sanity/client'
import {useCallback, useEffect, useMemo, useReducer, useState} from 'react'
import {catchError, of} from 'rxjs'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, getDraftId, type SanityDocument, useClient} from 'sanity'

interface DocumentDeletedAction {
  id: string
  type: 'DOCUMENT_DELETED'
}

interface DocumentUpdatedAction {
  payload: SanityDocument
  type: 'DOCUMENT_UPDATED'
}

interface DocumentsSetAction {
  documents: SanityDocument[]
  type: 'DOCUMENTS_SET'
}

interface DocumentReceivedAction {
  payload: SanityDocument
  type: 'DOCUMENT_RECEIVED'
}

export type DocumentsReducerAction =
  | DocumentDeletedAction
  | DocumentUpdatedAction
  | DocumentsSetAction
  | DocumentReceivedAction

export interface DocumentsReducerState {
  documents: Record<string, SanityDocument>
}

function createDocumentsSet(documents: SanityDocument[]) {
  const documentsById = documents.reduce((acc, doc) => ({...acc, [doc._id]: doc}), {})
  return documentsById
}

function documentsReducer(
  state: DocumentsReducerState,
  action: DocumentsReducerAction,
): DocumentsReducerState {
  switch (action.type) {
    case 'DOCUMENTS_SET': {
      // Create an object with the documents id as key
      const documents = createDocumentsSet(action.documents)

      return {
        ...state,
        documents: documents,
      }
    }

    case 'DOCUMENT_RECEIVED': {
      const nextDocumentResult = action.payload as SanityDocument

      return {
        ...state,
        documents: {
          ...state.documents,
          [nextDocumentResult._id]: nextDocumentResult,
        },
      }
    }

    case 'DOCUMENT_DELETED': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {[action.id]: _, ...restDocuments} = state.documents

      return {
        ...state,
        documents: restDocuments,
      }
    }

    case 'DOCUMENT_UPDATED': {
      const updatedDocument = action.payload
      const id = updatedDocument._id as string
      const document = state.documents[id]

      const nextDocument = {
        // Add existing document data
        ...document,
        // Add incoming document data
        ...updatedDocument,
      } satisfies SanityDocument

      return {
        ...state,
        documents: {
          ...state.documents,
          [id]: nextDocument,
        },
      }
    }

    default:
      return state
  }
}

const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
  includeAllVersions: true,
  tag: 'document-sheet-list-store',
}

/**
 * TODO:
 * [] Lazy load more documents, reduce initial fetch.
 * [] Add support for sorting and filtering.
 * []  Make a projection of the query according to the schema. e.g. get only the primitive fields and the _id to reduce the data payload.
 */
export function useDocumentSheetListStore({
  filter,
  params,
  apiVersion,
}: {
  filter: string
  params?: Record<string, unknown>
  apiVersion?: string
}) {
  const QUERY = `*[${filter}][0...2000]`
  const client = useClient({
    ...DEFAULT_STUDIO_CLIENT_OPTIONS,
    apiVersion: apiVersion || DEFAULT_STUDIO_CLIENT_OPTIONS.apiVersion,
  })
  const [state, dispatch] = useReducer(documentsReducer, {
    documents: {},
  })
  const [isLoading, setIsLoading] = useState<boolean>(client !== null)
  const [error, setError] = useState<Error | null>(null)

  const initialFetch = useCallback(async () => {
    if (!client) {
      setIsLoading(false)
      return
    }
    try {
      const res = await client.fetch(QUERY, params)
      dispatch({type: 'DOCUMENTS_SET', documents: res})
      setIsLoading(false)
    } catch (err) {
      setError(err)
    }
  }, [client, params, QUERY])

  const handleListenerEvent = useCallback(
    async (event: ListenEvent<Record<string, SanityDocument>>) => {
      // Fetch all documents on initial connection
      if (event.type === 'welcome') {
        setIsLoading(true)
        await initialFetch()
        setIsLoading(false)
      }

      // The reconnect event means that we are trying to reconnect to the realtime listener.
      // In this case we set loading to true to indicate that we're trying to
      // reconnect. Once a connection has been established, the welcome event
      // will be received and we'll fetch all documents again (above).
      if (event.type === 'reconnect') {
        setIsLoading(true)
      }

      // Handle mutations (create, update, delete) from the realtime listener
      // and update the documents store accordingly
      if (event.type === 'mutation') {
        if (event.transition === 'appear') {
          const nextDocument = event.result as SanityDocument | undefined

          if (nextDocument) {
            dispatch({
              type: 'DOCUMENT_RECEIVED',
              payload: nextDocument,
            })
          }
        }

        if (event.transition === 'disappear') {
          dispatch({type: 'DOCUMENT_DELETED', id: event.documentId})
        }

        if (event.transition === 'update') {
          const updatedDocument = event.result as SanityDocument | undefined

          if (updatedDocument) {
            dispatch({
              type: 'DOCUMENT_UPDATED',
              payload: updatedDocument,
            })
          }
        }
      }
    },
    [initialFetch],
  )

  const listener$ = useMemo(() => {
    if (!client) return of()

    const events$ = client.observable.listen(QUERY, params, LISTEN_OPTIONS).pipe(
      catchError((err) => {
        setError(err)
        return of(err)
      }),
    )

    return events$
  }, [client, params, QUERY])

  useEffect(() => {
    const sub = listener$.subscribe(handleListenerEvent)

    return () => {
      sub?.unsubscribe()
    }
  }, [handleListenerEvent, listener$])

  // Contemplate that we could have drafts and live documents here, merge them.
  const dataAsArray = useMemo(() => {
    // Joins the drafts and the live documents
    const uniques = Object.keys(state.documents).reduce(
      (acc: {[key: string]: SanityDocument}, key) => {
        const document = state.documents[key]
        const isDraft = document._id === getDraftId(document._id)
        const id = isDraft ? document._id : getDraftId(document._id)
        // If we already have the document, and this document is not the draft one, it means
        // the draft hast already been added to the list, so we skip it.
        if (acc[id] && !isDraft) {
          return acc
        }
        acc[id] = document
        return acc
      },
      {},
    )
    return Object.values(uniques)
  }, [state.documents])

  return {
    data: dataAsArray,
    isLoading,
    error,
  }
}
