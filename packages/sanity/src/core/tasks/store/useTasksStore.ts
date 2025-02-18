import {type ListenEvent, type ListenOptions} from '@sanity/client'
import {useCallback, useEffect, useMemo, useReducer, useState} from 'react'
import {catchError, of} from 'rxjs'

import {useAddonDataset} from '../../studio'
import {getPublishedId} from '../../util'
import {type Loadable, type TaskDocument} from '../types'
import {tasksReducer, type TasksReducerAction, type TasksReducerState} from './reducer'

export interface TasksStoreOptions {
  documentId?: string
}

interface TasksStoreReturnType extends Loadable<TaskDocument[]> {
  dispatch: React.Dispatch<TasksReducerAction>
}

const INITIAL_STATE: TasksReducerState = {
  tasks: {},
}

const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
  includeAllVersions: true,
  tag: 'tasks-store',
}

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type == "tasks.task"`]

const QUERY_PROJECTION = `{
  ...,
}`

// Newest tasks first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTERS.join(' && ')}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

export function useTasksStore(opts: TasksStoreOptions): TasksStoreReturnType {
  const {client} = useAddonDataset()
  const {documentId} = opts

  const [state, dispatch] = useReducer(tasksReducer, INITIAL_STATE)
  const [isLoading, setIsLoading] = useState<boolean>(client !== null)
  const [error, setError] = useState<Error | null>(null)

  const params = useMemo(
    () => ({documentId: documentId ? getPublishedId(documentId) : null}),
    [documentId],
  )

  const initialFetch = useCallback(async () => {
    if (!client) {
      setIsLoading(false)
      return
    }

    try {
      const res = await client.fetch(QUERY, params)
      dispatch({type: 'TASKS_SET', tasks: res})
      setIsLoading(false)
    } catch (err) {
      setError(err)
    }
  }, [client, params])

  const handleListenerEvent = useCallback(
    async (event: ListenEvent<Record<string, TaskDocument>>) => {
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
          const nextTask = event.result as TaskDocument | undefined

          if (nextTask) {
            dispatch({
              type: 'TASK_RECEIVED',
              payload: nextTask,
            })
          }
        }

        if (event.transition === 'disappear') {
          dispatch({type: 'TASK_DELETED', id: event.documentId})
        }

        if (event.transition === 'update') {
          const updatedTask = event.result as TaskDocument | undefined

          if (updatedTask) {
            dispatch({
              type: 'TASK_UPDATED',
              payload: updatedTask,
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
  }, [client, params])

  useEffect(() => {
    const sub = listener$.subscribe(handleListenerEvent)

    return () => {
      sub?.unsubscribe()
    }
  }, [handleListenerEvent, listener$])

  // Transform tasks object to array
  const tasksAsArray = useMemo(() => Object.values(state.tasks), [state.tasks])

  return {
    data: tasksAsArray,
    dispatch,
    error,
    isLoading,
  }
}
