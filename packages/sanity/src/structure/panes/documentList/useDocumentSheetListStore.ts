import {type ListenEvent, type ListenOptions} from '@sanity/client'
import {useCallback, useEffect, useMemo, useReducer, useState} from 'react'
import {catchError, of} from 'rxjs'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, type SanityDocument, useClient} from 'sanity'

interface DocumentAddedAction {
  payload: SanityDocument
  type: 'DOCUMENT_ADDED'
}

interface DocumentDeletedAction {
  id: string
  type: 'DOCUMENT_DELETED'
}

interface DocumentUpdatedAction {
  payload: SanityDocument
  type: 'DOCUMENT_UPDATED'
}

interface DocumentsSetAction {
  tasks: SanityDocument[]
  type: 'DOCUMENTS_SET'
}

interface DocumentReceivedAction {
  payload: SanityDocument
  type: 'DOCUMENT_RECEIVED'
}

export type DocumentsReducerAction =
  | DocumentAddedAction
  | DocumentDeletedAction
  | DocumentUpdatedAction
  | DocumentsSetAction
  | DocumentReceivedAction

export interface DocumentsReducerState {
  documents: Record<string, SanityDocument>
}

function createDocumentsSet(tasks: SanityDocument[]) {
  const tasksById = tasks.reduce((acc, task) => ({...acc, [task._id]: task}), {})
  return tasksById
}

function tasksReducer(
  state: DocumentsReducerState,
  action: DocumentsReducerAction,
): DocumentsReducerState {
  switch (action.type) {
    case 'DOCUMENTS_SET': {
      // Create an object with the task id as key
      const tasksById = createDocumentsSet(action.tasks)

      return {
        ...state,
        documents: tasksById,
      }
    }

    case 'DOCUMENT_ADDED': {
      const nextDocumentResult = action.payload as SanityDocument
      const nextDocumentValue = nextDocumentResult satisfies SanityDocument

      const nextDocument = {
        [nextDocumentResult._id]: {
          ...state.documents[nextDocumentResult._id],
          ...nextDocumentValue,
          _state: nextDocumentResult._state || undefined,
          // If the task is created optimistically, it won't have a createdAt date as this is set on the server.
          // However, we need to set a createdAt date to be able to sort the tasks correctly.
          // Therefore, we set the createdAt date to the current date here if it's missing while creating the task.
          // Once the task is created and received from the server, the createdAt date will be updated to the correct value.
          _createdAt: nextDocumentResult._createdAt || new Date().toISOString(),
        } satisfies SanityDocument,
      }

      return {
        ...state,
        documents: {
          ...state.documents,
          ...nextDocument,
        },
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
      const task = state.documents[id]

      const nextDocument = {
        // Add existing task data
        ...task,
        // Add incoming task data
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
}

/**
 * TODO:
 * [] Lazy load more documents, reduce initial fetch.
 * [] Add support for sorting and filtering.
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
  // TODO: Make a projection of the query according to the schema. e.g. get only the primitive fields and the _id.
  const QUERY = `*[${filter}][0...2000]`
  const client = useClient({
    ...DEFAULT_STUDIO_CLIENT_OPTIONS,
    apiVersion: apiVersion || DEFAULT_STUDIO_CLIENT_OPTIONS.apiVersion,
  })
  const [state, dispatch] = useReducer(tasksReducer, {
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
      dispatch({type: 'DOCUMENTS_SET', tasks: res})
      setIsLoading(false)
    } catch (err) {
      setError(err)
    }
  }, [client, params, QUERY])

  const handleListenerEvent = useCallback(
    async (event: ListenEvent<Record<string, SanityDocument>>) => {
      // Fetch all tasks on initial connection
      if (event.type === 'welcome') {
        setIsLoading(true)
        await initialFetch()
        setIsLoading(false)
      }

      // The reconnect event means that we are trying to reconnect to the realtime listener.
      // In this case we set loading to true to indicate that we're trying to
      // reconnect. Once a connection has been established, the welcome event
      // will be received and we'll fetch all tasks again (above).
      if (event.type === 'reconnect') {
        setIsLoading(true)
      }

      // Handle mutations (create, update, delete) from the realtime listener
      // and update the tasks store accordingly
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

  const dataAsArray = useMemo(() => Object.values(state.documents), [state.documents])

  return {
    data: dataAsArray,
    isLoading,
    error,
  }
}
