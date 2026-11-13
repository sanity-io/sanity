import {type MutationEvent} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable, useObservableSubject} from 'react-rx'
import {distinctUntilChanged, filter, map, merge, type Observable, of, scan} from 'rxjs'

import {
  type AddonDatasetDocument,
  type AddonDatasetQueryEvent,
  type AddonDatasetQueryStatusEvent,
  listenAddonDatasetQuery,
} from '../../store/addonDatasetListener/createAddonDatasetListenerStore'
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

interface TasksStoreState extends TasksReducerState {
  isLoading: boolean
  error: Error | null
}

type TasksStoreAction = TasksReducerAction | AddonDatasetQueryStatusEvent

const LOADING_STATE: TasksStoreState = {tasks: {}, isLoading: true, error: null}
const IDLE_STATE: TasksStoreState = {tasks: {}, isLoading: false, error: null}

const SORT_FIELD = '_createdAt'
const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type == "tasks.task"`]

const QUERY_PROJECTION = `{
  ...,
}`

// Newest tasks first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTERS.join(' && ')}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

/**
 * The store action for a mutation from the realtime listener, or `null` when it does not concern
 * the store. The shared listener also reports comments, which the reducer ignores on delete and
 * which are never added.
 */
function mutationToAction(event: MutationEvent<AddonDatasetDocument>): TasksReducerAction | null {
  if (event.transition === 'disappear') {
    return {type: 'TASK_DELETED', id: event.documentId}
  }

  const document = event.result
  if (document?._type !== 'tasks.task') return null

  return event.transition === 'appear'
    ? {type: 'TASK_RECEIVED', payload: document}
    : {type: 'TASK_UPDATED', payload: document}
}

/** The store action for an event of the tasks query, or `null` when it does not concern the store */
function queryEventToAction(event: AddonDatasetQueryEvent<TaskDocument>): TasksStoreAction | null {
  switch (event.type) {
    case 'loading':
    case 'error':
      return event
    case 'loaded':
      return {type: 'TASKS_SET', tasks: event.documents}
    case 'mutation':
      return mutationToAction(event)
    default: {
      const unhandled: never = event
      return unhandled
    }
  }
}

/**
 * Applies `tasksReducer` to the tasks, and returns `state` itself when nothing changed so the
 * consumers' data keeps its identity.
 */
function tasksStoreReducer(state: TasksStoreState, action: TasksStoreAction): TasksStoreState {
  switch (action.type) {
    case 'loading':
      return state.isLoading ? state : {...state, isLoading: true}
    case 'error':
      return {...state, error: action.error, isLoading: false}
    case 'TASKS_SET':
      return {...state, tasks: tasksReducer(state, action).tasks, isLoading: false}
    case 'TASK_ADDED':
    case 'TASK_DELETED':
    case 'TASK_RECEIVED':
    case 'TASK_UPDATED': {
      const {tasks} = tasksReducer(state, action)
      return tasks === state.tasks ? state : {...state, tasks}
    }
    default: {
      const unhandled: never = action
      return unhandled
    }
  }
}

export function useTasksStore(opts: TasksStoreOptions): TasksStoreReturnType {
  const {client} = useAddonDataset()
  const listenerStore = useAddonDatasetListenerStore()
  const publishedId = opts.documentId ? getPublishedId(opts.documentId) : null

  const [localActions$, dispatch] = useObservableSubject<TasksReducerAction>()

  const state$: Observable<TasksStoreState> = useMemo(() => {
    if (!client || !listenerStore) return of(IDLE_STATE)

    const fetchTasks = client.observable.fetch<TaskDocument[]>(QUERY, {documentId: publishedId})
    const remoteActions$ = listenAddonDatasetQuery(listenerStore, fetchTasks).pipe(
      map(queryEventToAction),
      filter((action) => action !== null),
    )

    return merge(remoteActions$, localActions$).pipe(
      scan(tasksStoreReducer, LOADING_STATE),
      distinctUntilChanged(),
    )
  }, [client, listenerStore, localActions$, publishedId])

  const state = useObservable(state$, () => (client ? LOADING_STATE : IDLE_STATE))

  // Transform tasks object to array
  const tasksAsArray = useMemo(() => Object.values(state.tasks), [state.tasks])

  return {
    data: tasksAsArray,
    dispatch,
    error: state.error,
    isLoading: state.isLoading,
  }
}
