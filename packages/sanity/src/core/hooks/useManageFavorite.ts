import {type Node} from '@sanity/comlink'
import {
  type CanvasResource,
  type Events,
  type FrameMessages,
  type MediaResource,
  type StudioResource,
  type WindowMessages,
} from '@sanity/message-protocol'
import {type DocumentHandle} from '@sanity/sdk'
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  catchError,
  connect,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  iif,
  map,
  merge,
  mergeMap,
  NEVER,
  type Observable,
  of,
  type OperatorFunction,
  pipe,
  scan,
  startWith,
  Subject,
  switchMap,
  tap,
  throwError,
  timeout,
} from 'rxjs'

import {useComlinkStore} from '../store/_legacy/datastores'

interface FavoriteStatusResponse {
  isFavorited: boolean
}

interface ManageFavorite {
  favorite: () => void
  unfavorite: () => void
  isFavorited: boolean | undefined
  /**
   * Whether the initial remote read task has succeeded.
   */
  isReady: boolean
}

/**
 * @internal
 */
export interface UseManageFavoriteProps extends DocumentHandle {
  resourceId?: string
  resourceType: StudioResource['type'] | MediaResource['type'] | CanvasResource['type']
  /**
   * The name of the schema collection this document belongs to.
   * Typically is the name of the workspace when used in the context of a studio.
   */
  schemaName?: string
}

type Context = Pick<
  UseManageFavoriteProps,
  'documentId' | 'documentType' | 'resourceId' | 'resourceType' | 'schemaName'
>

const FAVORITES_FETCH_TIMEOUT = 3000

/**
 * IMPORTANT!
 *
 * Loosely based on the `useManageFavorite.ts` from `@sanity/sdk`.
 * This version has been modified to use Studio's Comlink Store.
 *
 * TODO: Adopt `@sanity/sdk`.
 *
 * ---
 *
 * This hook provides functionality to add and remove documents from favorites,
 * and tracks the current favorite status of the document.
 *
 * @internal
 */
export function useManageFavorite({
  documentId,
  documentType,
  projectId,
  dataset,
  resourceId: paramResourceId,
  resourceType,
  schemaName,
}: UseManageFavoriteProps): ManageFavorite {
  const {node} = useComlinkStore()

  if (resourceType === 'studio' && (!projectId || !dataset)) {
    throw new Error('projectId and dataset are required for studio resources')
  }
  // Compute the final resourceId
  const resourceId =
    resourceType === 'studio' && !paramResourceId ? `${projectId}.${dataset}` : paramResourceId

  if (!resourceId) {
    throw new Error('resourceId is required for media-library and canvas resources')
  }

  const context = useMemo<Context>(
    () => ({
      documentId,
      documentType,
      resourceId,
      resourceType,
      schemaName,
    }),
    [documentId, documentType, resourceId, resourceType, schemaName],
  )

  const stateController = useMemo(() => optimisticState({node, context}), [context, node])
  const state = useObservable(stateController.state)

  return {
    favorite: useCallback(() => stateController.setState(true), [stateController]),
    unfavorite: useCallback(() => stateController.setState(false), [stateController]),
    isFavorited: state?.value,
    isReady: state?.isReady ?? false,
  }
}

interface State {
  value: boolean | undefined
  isReady: boolean
}

type Action =
  | {
      type: 'BEGIN_READ'
    }
  | {
      type: 'END_READ'
      payload: {
        isFavorited: boolean
      }
    }
  | {
      type: 'SET'
      payload: boolean
    }

const INITIAL_STATE: State = {
  value: undefined,
  isReady: false,
}

/**
 * Control the local favorite state optimistically, writing it to the remote after a debounce period
 * if it has changed.
 */
function optimisticState({
  node,
  context,
}: {
  node: Node<FrameMessages, WindowMessages> | undefined
  context: Context
}) {
  const dispatchSubject = new Subject<boolean>()
  const setState = (value: boolean) => dispatchSubject.next(value)
  let previousState: boolean | undefined

  const state = iif(
    () => typeof node === 'undefined',
    of(INITIAL_STATE),
    merge(
      dispatchSubject.pipe(
        distinctUntilChanged(),
        filter((value) => typeof value === 'boolean'),
        connect<boolean, Observable<Action>>((shared) => {
          return merge(
            shared.pipe(
              map((value) => ({
                type: 'SET' as const,
                payload: value,
              })),
            ),
            shared.pipe(
              debounceTime(750),
              filter((value) => {
                if (typeof previousState === 'undefined') {
                  return false
                }
                return value !== previousState
              }),
              writeRemoteState({node, context}),
              tap(({success, isFavorited}) => {
                if (success) {
                  previousState = isFavorited
                }
              }),
              switchMap(() => EMPTY),
            ),
          )
        }),
      ),
      readRemoteState({node, context}).pipe(
        map((response) => ({
          type: 'END_READ' as const,
          payload: response,
        })),
        tap(({payload}) => {
          previousState = payload.isFavorited
        }),
        startWith({
          type: 'BEGIN_READ' as const,
        }),
      ),
    ).pipe(reducer()),
  )

  return {
    state,
    setState,
  }
}

function reducer(): OperatorFunction<Action, State> {
  return scan((previousState, action) => {
    switch (action.type) {
      case 'BEGIN_READ':
        return {
          ...previousState,
          isReady: false,
        }
      case 'END_READ':
        return {
          ...previousState,
          value: action.payload.isFavorited,
          isReady: true,
        }
      case 'SET':
        return {
          ...previousState,
          value: action.payload,
        }
      default:
        return previousState
    }
  }, INITIAL_STATE)
}

function readRemoteState({
  node,
  context,
}: {
  node: Node<FrameMessages, WindowMessages> | undefined
  context: Context
}): Observable<{isFavorited: boolean}> {
  if (typeof context.resourceId === 'undefined') {
    return EMPTY
  }

  if (typeof node === 'undefined') {
    return EMPTY
  }

  const payload: Events.FavoriteMessage['data'] = {
    document: {
      id: context.documentId,
      type: context.documentType,
      resource: {
        id: context.resourceId,
        type: context.resourceType,
        schemaName: context.schemaName,
      },
    },
  }

  return from(
    node.fetch<Events.FavoriteQueryMessage['type'], Events.FavoriteQueryMessage>(
      'dashboard/v1/events/favorite/query',
      payload,
    ) as Promise<FavoriteStatusResponse>,
  ).pipe(
    timeout({
      first: FAVORITES_FETCH_TIMEOUT,
      with: () => throwError(() => new Error('Favorites service connection timeout')),
    }),
    map((response) => {
      return {
        isFavorited: response.isFavorited,
      }
    }),
    catchError((err) => {
      console.error('Favorites service connection error', err)
      return of({
        isFavorited: false,
      })
    }),
  )
}

function writeRemoteState({
  node,
  context,
}: {
  node: Node<FrameMessages, WindowMessages> | undefined
  context: Context
}): OperatorFunction<boolean, {success: boolean; isFavorited: boolean}> {
  return pipe(
    mergeMap((value) => {
      if (typeof context.resourceId === 'undefined') {
        return EMPTY
      }

      if (typeof node === 'undefined') {
        return EMPTY
      }

      const payload: Events.FavoriteMessage['data'] = {
        eventType: value ? 'added' : 'removed',
        document: {
          id: context.documentId,
          type: context.documentType,
          resource: {
            id: context.resourceId,
            type: context.resourceType,
            ...(context.schemaName ? {schemaName: context.schemaName} : {}),
          },
        },
      }

      return from(
        node.fetch<Events.FavoriteMutateMessage['type'], Events.FavoriteMutateMessage>(
          'dashboard/v1/events/favorite/mutate',
          payload,
        ),
      ).pipe(
        catchError((error) => {
          console.error('Favorites service write error', error)
          return NEVER
        }),
        map((response) => {
          return {
            success:
              typeof response === 'object' &&
              response !== null &&
              'success' in response &&
              Boolean(response.success),
            isFavorited: value,
          }
        }),
      )
    }, 1),
  )
}
