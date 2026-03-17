import {type ObjectSchemaType, type Path, type SchemaType} from '@sanity/types'
import {fromString, startsWith, toString} from '@sanity/util/paths'
import pick from 'lodash-es/pick'
import {useCallback, useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  BehaviorSubject,
  combineLatest,
  filter,
  first,
  map,
  merge,
  type Observable,
  of,
  shareReplay,
  Subject,
  switchScan,
} from 'rxjs'

import {type DiffComponent, type DiffComponentOptions} from '../field'
import {type FormState} from '../form/store'
import {type CollatedDocumentDivergencesState} from './collateDocumentDivergences'
import {type Divergence, type DivergenceAtPath} from './readDocumentDivergences'
import {transposeSchema} from './transposeSchema'

/**
 * A divergence that has been transposed onto a schema type and that can be
 * reached in the document editor.
 *
 * @internal
 */
export type ReachableDivergence = Divergence & {
  /**
   * A composite divergence occurs when there is a divergence in a leaf node,
   * but it does not make sense to report it directly.
   *
   * A good example is when a divergence occurs in a reference field. It's not
   * useful to report the `_ref` id change directly, nor does it integrate
   * well with the document editor. Instead, the divergence is reported on the
   * reference field itself.
   *
   * Composite divergences are identified by checking whether they descend a
   * node that has a dedicated diff component.
   */
  isComposite: boolean
  /**
   * All of the divergences this reachable divergence is composed of.
   *
   * To perform an action (e.g. ignore or copy from upstream) on a composite
   * divergence, the action must be performed on all descendant divergences.
   */
  divergences: DivergenceAtPath[]
  diffComponent?: DiffComponent | DiffComponentOptions
  schemaType: SchemaType
}

/**
 * @internal
 */
export type ReachableDivergenceAtPath = [path: string, divergence: ReachableDivergence]

/**
 * @internal
 */
export interface DivergenceNavigatorState {
  focusedDivergence: string | undefined
  previousDivergence: string | undefined
  nextDivergence: string | undefined
  state: CollatedDocumentDivergencesState['state']
  upstreamId: string | undefined
  /**
   * For iterating ancestors when copying changes from upstream.
   */
  allDivergences: DivergenceAtPath[]
  /**
   * For paging through all reachable divergences in the document.
   */
  divergences: ReachableDivergenceAtPath[]
  /**
   * For showing a summary of divergences occurring node-by-node, and allowing
   * the editor to focus the first divergence inside a node.
   */
  divergencesByNode: Record<string, number>
}

/**
 * @internal
 */
export interface DivergenceNavigator {
  /**
   * Focus the divergence at the provided path.
   */
  focusDivergence: (path: string) => void
  /**
   * Blur the divergence at the provided path.
   */
  blurDivergence: (path: string) => void
  /**
   * Blur the current focused divergence.
   */
  blurFocusedDivergence: () => void
  /**
   * The current state.
   */
  state: DivergenceNavigatorState
}

type Action =
  | {
      type: 'FOCUS'
      context: {
        path: string
      }
    }
  | {
      type: 'BLUR'
      context: {
        path: string
      }
    }
  | {
      type: 'BLUR_FOCUSED'
      context?: never
    }
  | {
      type: 'READ_DIVERGENCES'
      context: {
        divergences: CollatedDocumentDivergencesState
        schemaType: ObjectSchemaType
        formState: Pick<FormState, 'groups' | '_allMembers'>
      }
    }

interface DivergenceNavigatorContext {
  divergences: Observable<CollatedDocumentDivergencesState>
  schemaType: ObjectSchemaType
  formState: Pick<FormState, 'groups' | '_allMembers'>
}

interface StateContext {
  divergences: CollatedDocumentDivergencesState
  schemaType: ObjectSchemaType
  formState: Pick<FormState, 'groups' | '_allMembers'>
}

/**
 * Transpose a set of divergences onto the provided schema type, and create the
 * state and functions necessary to render and navigate them.
 *
 * @internal
 */
export function useDivergenceNavigator({
  divergences,
  schemaType,
  formState,
}: DivergenceNavigatorContext): DivergenceNavigator {
  const dispatch = useMemo(() => new Subject<Action>(), [])

  const schemaTypeContext = useMemo(
    () => new BehaviorSubject<ObjectSchemaType | undefined>(undefined),
    [],
  )
  useEffect(() => schemaTypeContext.next(schemaType), [schemaTypeContext, schemaType])

  const formStateContext = useMemo(
    () => new BehaviorSubject<Pick<FormState, 'groups' | '_allMembers'> | undefined>(undefined),
    [],
  )
  useEffect(() => formStateContext.next(formState), [formStateContext, formState])

  const context = useMemo<Observable<StateContext>>(
    () =>
      combineLatest({
        divergences: divergences,
        schemaType: schemaTypeContext.pipe(filter((value) => typeof value !== 'undefined')),
        formState: formStateContext.pipe(
          filter((value) => typeof value !== 'undefined'),
          // Form state is used to map divergences to fields, and order them to
          // match the order fields and groups are rendered in the document
          // editor.
          //
          // However, form state also encapsulates current value, the focused
          // path, etc. and changes with every change to the displayed document
          // and interaction with the document editor.
          //
          // It's unnecessary to remap divergences every time the displayed
          // document or state, like the focus path, changes. Therefore, this
          // code takes only the first form state value emitted.
          first(),
          map((state) => (state ? pick(state, ['groups', '_allMembers']) : state)),
        ),
      }),
    [divergences, schemaTypeContext, formStateContext],
  )

  const readState = useMemo(() => createStateReducer({dispatch, context}), [dispatch, context])

  const focusDivergence: DivergenceNavigator['focusDivergence'] = useCallback(
    (path) => {
      dispatch.next({
        type: 'FOCUS',
        context: {
          path,
        },
      })
    },
    [dispatch],
  )

  const blurDivergence: DivergenceNavigator['blurDivergence'] = useCallback(
    (path) => {
      dispatch.next({
        type: 'BLUR',
        context: {
          path,
        },
      })
    },
    [dispatch],
  )

  const blurFocusedDivergence: DivergenceNavigator['blurFocusedDivergence'] = useCallback(() => {
    dispatch.next({
      type: 'BLUR_FOCUSED',
    })
  }, [dispatch])

  const state = useObservable(readState, {
    focusedDivergence: undefined,
    previousDivergence: undefined,
    nextDivergence: undefined,
    upstreamId: undefined,
    state: 'pending',
    divergences: [],
    allDivergences: [],
    divergencesByNode: {},
  })

  return {
    state,
    focusDivergence,
    blurDivergence,
    blurFocusedDivergence,
  }
}

/**
 * Ensure the `focusedDivergence` path leads to an addressable divergence, and
 * set the previous and next divergence paths.
 *
 * This implementation allows users to cycle through divergences infinitely.
 */
function withAddressablePaths(state: DivergenceNavigatorState): DivergenceNavigatorState {
  const focusedDivergenceIndex = state.divergences.findIndex(
    ([path]) => path === state.focusedDivergence,
  )

  return {
    ...state,
    focusedDivergence: focusedDivergenceIndex === -1 ? undefined : state.focusedDivergence,
    previousDivergence:
      typeof state.focusedDivergence === 'undefined'
        ? undefined
        : state.divergences.at(
            (focusedDivergenceIndex - 1 + state.divergences.length) % state.divergences.length,
          )?.[0],
    nextDivergence:
      typeof state.focusedDivergence === 'undefined'
        ? undefined
        : state.divergences.at((focusedDivergenceIndex + 1) % state.divergences.length)?.[0],
  }
}

/**
 * Check whether the currently focused divergence has been eliminated, or has
 * become resolved. When this occurs, the next divergence will be automatically
 * focused.
 */
function shouldFocusNextDivergence(
  state: DivergenceNavigatorState,
  divergences: ReachableDivergenceAtPath[],
): boolean {
  if (
    typeof state.focusedDivergence === 'undefined' ||
    typeof state.nextDivergence === 'undefined'
  ) {
    return false
  }

  const focusedDivergence = divergences.find(([path]) => path === state.focusedDivergence)?.[1]

  const shouldFocusNext =
    typeof focusedDivergence === 'undefined' || focusedDivergence.status === 'resolved'

  return shouldFocusNext
}

function createStateReducer({
  dispatch,
  context,
}: {
  dispatch: Subject<Action>
  context: Observable<StateContext>
}) {
  return merge(
    dispatch,
    context.pipe(
      map(
        (nextContext) =>
          ({
            type: 'READ_DIVERGENCES',
            context: nextContext,
          }) satisfies Action,
      ),
    ),
  ).pipe(
    switchScan<Action, DivergenceNavigatorState, Observable<DivergenceNavigatorState>>(
      (state, action) => {
        switch (action.type) {
          case 'READ_DIVERGENCES': {
            return transposeSchema(
              action.context.divergences.divergences,
              action.context.schemaType,
              action.context.formState,
            ).pipe(
              map(({divergences, divergencesByNode}) => {
                return withAddressablePaths({
                  ...state,
                  upstreamId: action.context.divergences.upstreamId,
                  state: action.context.divergences.state,
                  allDivergences: Object.entries(action.context.divergences.divergences),
                  divergences,
                  divergencesByNode,
                  focusedDivergence: shouldFocusNextDivergence(state, divergences)
                    ? state.nextDivergence
                    : state.focusedDivergence,
                })
              }),
            )
          }
          case 'FOCUS': {
            return of(
              withAddressablePaths({
                ...state,
                focusedDivergence: action.context.path,
              }),
            )
          }
          case 'BLUR': {
            if (typeof state.focusedDivergence === 'undefined') {
              return of(state)
            }

            if (action.context.path !== state.focusedDivergence) {
              return of(state)
            }

            return of(
              withAddressablePaths({
                ...state,
                focusedDivergence: undefined,
              }),
            )
          }
          case 'BLUR_FOCUSED': {
            return of(
              withAddressablePaths({
                ...state,
                focusedDivergence: undefined,
              }),
            )
          }
          default: {
            return of(state)
          }
        }
      },
      {
        focusedDivergence: undefined,
        previousDivergence: undefined,
        nextDivergence: undefined,
        upstreamId: undefined,
        state: 'pending',
        divergences: [],
        allDivergences: [],
        divergencesByNode: {},
      },
    ),
    shareReplay(1),
  )
}

/**
 * @internal
 */
export function selectDivergenceCount(
  state: DivergenceNavigatorState | undefined,
  path: Path,
): number | undefined {
  return state?.divergencesByNode?.[toString(path)]
}

/**
 * Select divergence by path.
 *
 * @internal
 */
export function selectDivergence(
  state: DivergenceNavigatorState | undefined,
  path: Path,
): ReachableDivergence | undefined {
  if (typeof state === 'undefined') {
    return undefined
  }

  return state.divergences
    .filter(([divergencePath]) => divergencePath === toString(path))
    .map(([, divergence]) => divergence)
    .at(0)
}

/**
 * Select first descendant divergence by path.
 *
 * @internal
 */
export function selectFirstDescendantDivergence(
  state: DivergenceNavigatorState | undefined,
  path: Path,
): ReachableDivergence | undefined {
  return state?.divergences.find(([divergencePath]) =>
    startsWith(path, fromString(divergencePath)),
  )?.[1]
}
