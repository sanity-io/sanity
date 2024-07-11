import {type ListenEvent, type ListenOptions} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {type Dispatch, useCallback, useMemo, useReducer, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, concatMap, map, of, retry, timeout} from 'rxjs'
import {type SanityClient} from 'sanity'

interface DocumentAddedAction<T> {
  payload: T
  type: 'DOCUMENT_ADDED'
}

interface DocumentDeletedAction {
  id: string
  type: 'DOCUMENT_DELETED'
}

interface DocumentUpdatedAction<T> {
  payload: T
  type: 'DOCUMENT_UPDATED'
}

interface DocumentSetAction<T> {
  payload: T[]
  type: 'DOCUMENTS_SET'
}

interface DocumentReceivedAction<T> {
  payload: T
  type: 'DOCUMENT_RECEIVED'
}

export type documentsReducerAction<T> =
  | DocumentAddedAction<T>
  | DocumentDeletedAction
  | DocumentUpdatedAction<T>
  | DocumentSetAction<T>
  | DocumentReceivedAction<T>

export interface documentsReducerState<T> {
  documents: Map<string, T>
}

function createDocumentsSet<T extends SanityDocument>(documents: T[]) {
  return documents.reduce((acc, doc) => {
    acc.set(doc._id, doc)
    return acc
  }, new Map<string, T>())
}

export function documentsReducer<T extends SanityDocument>(
  state: {documents: Map<string, T>},
  action: documentsReducerAction<T>,
): documentsReducerState<T> {
  switch (action.type) {
    case 'DOCUMENTS_SET': {
      const documentsById = createDocumentsSet(action.payload)

      return {
        ...state,
        documents: documentsById,
      }
    }

    case 'DOCUMENT_ADDED': {
      const addedDocument = action.payload as T
      const currentDocuments = new Map(state.documents)
      currentDocuments.set(addedDocument._id, addedDocument)

      return {
        ...state,
        documents: currentDocuments,
      }
    }

    case 'DOCUMENT_RECEIVED': {
      const receivedDocument = action.payload as T
      const currentDocuments = new Map(state.documents)
      currentDocuments.set(receivedDocument._id, receivedDocument)

      return {
        ...state,
        documents: currentDocuments,
      }
    }

    case 'DOCUMENT_DELETED': {
      const currentDocuments = new Map(state.documents)
      currentDocuments.delete(action.id)

      return {
        ...state,
        documents: currentDocuments,
      }
    }

    case 'DOCUMENT_UPDATED': {
      const updateDocument = action.payload
      const id = updateDocument._id as string
      const currentDocuments = new Map(state.documents)
      currentDocuments.set(id, updateDocument)

      return {
        ...state,
        documents: currentDocuments,
      }
    }

    default:
      return state
  }
}

interface ListenerOptions<T> {
  /**
   * Groq query to listen to
   */
  query: string
  client: SanityClient | null
}
const INITIAL_STATE = {documents: new Map()}
const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
}

export function useListener<T extends SanityDocument>({
  query,
  client,
}: ListenerOptions<T>): {
  documents: T[]
  error: Error | null
  loading: boolean
  dispatch: Dispatch<documentsReducerAction<T>>
} {
  const [state, dispatch] = useReducer(documentsReducer, INITIAL_STATE)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const didInitialFetch = useRef<boolean>(false)

  const initialFetch$ = useCallback(() => {
    if (!client) {
      return of(null) // emits null and completes if no client
    }
    return client.observable.fetch<T[]>(query).pipe(
      timeout(10000), // 10s timeout
      map((res) => {
        dispatch({type: 'DOCUMENTS_SET', payload: res})
        didInitialFetch.current = true
        setLoading(false)
      }),
      retry({
        count: 2,
        delay: 1000,
      }),
      catchError((err) => {
        if (err.name === 'TimeoutError') {
          console.error('Fetch operation timed out:', err)
        }
        setError(err)
        return of(null) // ensure stream completion even on error
      }),
    )
  }, [client, query])

  const handleListenerEvent = useCallback(
    (event: ListenEvent<Record<string, T>>) => {
      // Fetch all documents on initial connection
      if (event.type === 'welcome' && !didInitialFetch.current) {
        // Do nothing here, the initial fetch is done in the useEffect below
        initialFetch$()
      }

      // The reconnect event means that we are trying to reconnect to the realtime listener.
      // In this case we set loading to true to indicate that we're trying to
      // reconnect. Once a connection has been established, the welcome event
      // will be received and we'll fetch all documents again (above)
      if (event.type === 'reconnect') {
        setLoading(true)
        didInitialFetch.current = false
      }

      // Handle mutations (create, update, delete) from the realtime listener
      // and update the documents store accordingly
      if (event.type === 'mutation' && didInitialFetch.current) {
        if (event.transition === 'disappear') {
          dispatch({type: 'DOCUMENT_DELETED', id: event.documentId})
        }

        if (event.transition === 'appear') {
          const nextDocument = event.result as T | undefined

          if (nextDocument) {
            dispatch({type: 'DOCUMENT_RECEIVED', payload: nextDocument})
          }
        }

        if (event.transition === 'update') {
          const updatedDocument = event.result as T | undefined

          if (updatedDocument) {
            dispatch({type: 'DOCUMENT_UPDATED', payload: updatedDocument})
          }
        }
      }
    },
    [initialFetch$],
  )
  const listener$ = useMemo(() => {
    if (!client) return of()

    return client.observable.listen(query, {}, LISTEN_OPTIONS).pipe(
      map(handleListenerEvent),
      catchError((err) => {
        setError(err)
        return of(err)
      }),
    )
  }, [client, handleListenerEvent, query])

  const observable = useMemo(() => {
    if (!client) return of(null) // emits null and completes if no client
    return initialFetch$().pipe(concatMap(() => listener$))
  }, [initialFetch$, listener$, client])

  useObservable(observable)

  const documentsAsArray = useMemo(
    () => Array.from(state.documents.values()),
    [state.documents],
  ) as T[]

  return {
    documents: documentsAsArray,
    error,
    loading,
    dispatch,
  }
}
