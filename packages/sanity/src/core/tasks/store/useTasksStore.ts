import {useCallback, useEffect, useMemo, useReducer, useState} from 'react'
import {catchError, EMPTY} from 'rxjs'

import {type AddonDatasetListenerEvent} from '../../store/addonDatasetListener/createAddonDatasetListenerStore'
import {useAddonDataset} from '../../studio/addonDataset/useAddonDataset'
import {useAddonDatasetListenerStore} from '../../studio/addonDataset/useAddonDatasetListenerStore'
import {getPublishedId} from '../../util/draftUtils'
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

const SORT_FIELD = '_createdAt'
const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type == "tasks.task"`]

const QUERY_PROJECTION = `{
  ...,
}`

// Newest tasks first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTERS.join(' && ')}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

export function useTasksStore(opts: TasksStoreOptions): TasksStoreReturnType {
  const {client} = useAddonDataset()
  const listenerStore = useAddonDatasetListenerStore()
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
    async (event: AddonDatasetListenerEvent) => {
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
      // and update the tasks store accordingly. The shared listener also reports comments,
      // which the reducer ignores on delete and which are never added.
      if (event.type === 'mutation') {
        if (event.transition === 'disappear') {
          dispatch({type: 'TASK_DELETED', id: event.documentId})
          return
        }

        const document = event.result
        if (document?._type !== 'tasks.task') return

        if (event.transition === 'appear') {
          dispatch({
            type: 'TASK_RECEIVED',
            payload: document,
          })
        }

        if (event.transition === 'update') {
          dispatch({
            type: 'TASK_UPDATED',
            payload: document,
          })
        }
      }
    },
    [initialFetch],
  )

  const listener$ = useMemo(() => {
    if (!listenerStore) return EMPTY

    return listenerStore.events.pipe(
      catchError((err) => {
        setError(err)
        return EMPTY
      }),
    )
  }, [listenerStore])

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
