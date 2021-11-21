/* eslint-disable complexity */
import {SerializeError} from '@sanity/structure'
import {omit} from 'lodash'
import {Observable} from 'rxjs'
import {first} from 'rxjs/operators'
import {PaneNode, RouterPanes, RouterPaneSiblingContext, UnresolvedPaneNode} from '../types'
import {assignId} from './assignId'
import {createPaneResolver, PaneResolverMiddleware} from './createPaneResolver'
import {loadStructure} from './loadStructure'
import {memoBind} from './memoBind'
import {PaneResolutionError} from './PaneResolutionError'

const DEFAULT_MAX_BRANCHES = 100
const DEFAULT_MAX_PANE_TIMEOUT = 5 * 1000
const DEFAULT_MAX_TIMEOUT = 30 * 1000

const timer = (milliseconds: number) =>
  new Promise<'TIMER'>((resolve) => setTimeout(() => resolve('TIMER'), milliseconds))

interface TraverseOptions {
  unresolvedPane: UnresolvedPaneNode | undefined
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
  parent: PaneNode | null
  path: string[]
  currentId: string
  flatIndex: number
  levelIndex: number
}

export interface ResolveIntentOptions {
  rootPaneNode?: UnresolvedPaneNode
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
  /**
   * Overrides the default amount of max branches
   *
   * Allows specifying the max amount of items a list can have before the pane
   * resolver will skip it and log a warning.
   */
  maxBranches?: number
  /**
   * Overrides the default max pane timeout
   *
   * Allows specifying the max amount of time in milliseconds allotted before
   * the intent resolver skips trying to resolve the pane and logs a warning.
   */
  maxPaneTimeout?: number
  /**
   * Overrides the default max timeout
   *
   * Allows specifying the overall max amount of time in milliseconds before the
   * intent resolver times out and returns the fallback editor and logs a
   * warning.
   */
  maxTimeout?: number
}

/**
 * Resolves an intent request using breadth first search. If a match is not
 * found, the intent will resolve to the fallback editor.
 *
 * A match is found if:
 * 1. the `PaneNode` is of type `document` and the its ID matches the intent ID
 * 2. the `PaneNode` is of type `documentList` and the `schemaTypeName` matches
 * 3. the `PaneNode`'s `canHandleIntent` method returns true
 *
 * If a `PaneNode` of type `list` is found, it will be searched for a match
 * (unless `disableNestedIntentResolution` is true)
 *
 * @see PaneNode
 */
export async function resolveIntent(options: ResolveIntentOptions): Promise<RouterPanes> {
  const resolvedPaneCache = new Map<string, Observable<PaneNode>>()
  const {
    maxBranches = DEFAULT_MAX_BRANCHES,
    maxPaneTimeout = DEFAULT_MAX_PANE_TIMEOUT,
    maxTimeout = DEFAULT_MAX_TIMEOUT,
  } = options

  // this is a simple version of the memoizer in `createResolvedPaneNodeStream`
  const memoize: PaneResolverMiddleware = (nextFn) => (unresolvedPane, context, flatIndex) => {
    const key = unresolvedPane && `${assignId(unresolvedPane)}-${context.path.join('__')}`
    const cachedResolvedPane = key && resolvedPaneCache.get(key)
    if (cachedResolvedPane) return cachedResolvedPane

    const result = nextFn(unresolvedPane, context, flatIndex)
    if (key) resolvedPaneCache.set(key, result)
    return result
  }

  const resolvePane = createPaneResolver(memoize)

  const fallbackEditorPanes: RouterPanes = [
    [
      {
        id: `__edit__${options.params.id}`,
        params: {...omit(options.params, ['id']), type: options.params.type},
        payload: options.payload,
      },
    ],
  ]

  async function traverse({
    currentId,
    flatIndex,
    intent,
    params,
    parent,
    path,
    payload,
    unresolvedPane,
    levelIndex,
  }: TraverseOptions): Promise<
    Array<{panes: RouterPanes; depthIndex: number; levelIndex: number}>
  > {
    if (!unresolvedPane) return []

    const {id: targetId} = params
    const otherParams = omit(params, ['id', 'type'])
    const context: RouterPaneSiblingContext = {
      id: currentId,
      splitIndex: 0,
      parent,
      source: 'intent',
      path,
      index: flatIndex,
      params: {},
      payload: undefined,
    }

    let promiseResult

    try {
      promiseResult = await Promise.race([
        resolvePane(unresolvedPane, context, flatIndex).pipe(first()).toPromise(),
        timer(maxPaneTimeout),
      ])
    } catch (e) {
      if (e instanceof PaneResolutionError && e.cause instanceof SerializeError) throw e

      console.warn(`Pane \`${currentId}\` at ${path.join('.')} threw while resolving the intent`, e)

      return []
    }

    const resolvedPane = promiseResult

    if (resolvedPane === 'TIMER') {
      console.warn(
        `Pane \`${currentId}\` at ${path.join(
          '.'
        )} was skipped while resolving the intent because it took longer than ${maxPaneTimeout}ms.`
      )

      return []
    }

    // if the resolved pane is a document pane and the pane's ID matches then
    // resolve the intent to the current path
    if (resolvedPane.type === 'document' && resolvedPane.id === targetId) {
      return [
        {
          panes: [
            ...path.slice(0, path.length - 1).map((i) => [{id: i}]),
            [{id: targetId, params: otherParams, payload}],
          ],
          depthIndex: path.length,
          levelIndex,
        },
      ]
    }

    if (resolvedPane.canHandleIntent?.(intent, params, {pane: resolvedPane, index: flatIndex})) {
      return [
        {
          panes: [
            // map the current path to router panes
            ...path.map((id) => [{id}]),
            // then augment with the intents IDs and params
            [{id: params.id, params: otherParams, payload}],
          ],
          depthIndex: path.length,
          levelIndex,
        },
      ]
    }

    if (
      resolvedPane.type === 'list' &&
      resolvedPane.child &&
      resolvedPane.items &&
      !resolvedPane.disableNestedIntentResolution
    ) {
      if (resolvedPane.items.length > maxBranches) {
        console.warn(
          `Tried to resolve an intent within a pane that has over ${maxBranches} ` +
            'items. This is unsupported at this time. ' +
            'To disable this warning call `S.list().disableNestedIntentResolution()` ' +
            `from list \`${resolvedPane.id}\`${
              context.path.join('.') ? ` at ${context.path.join('.')}` : ''
            }`
        )
        return []
      }

      return (
        await Promise.all(
          resolvedPane.items.map((item, nextLevelIndex) => {
            if (item.type === 'divider') return Promise.resolve([])

            return traverse({
              currentId: item._id || item.id,
              flatIndex: flatIndex + 1,
              intent,
              params,
              parent: resolvedPane,
              path: [...path, item.id],
              payload,
              unresolvedPane:
                typeof resolvedPane.child === 'function'
                  ? memoBind(resolvedPane, 'child')
                  : resolvedPane.child,
              levelIndex: nextLevelIndex,
            })
          })
        )
      ).flat()
    }

    return []
  }

  const matchingPanes = await Promise.race([
    traverse({
      currentId: 'root',
      flatIndex: 0,
      levelIndex: 0,
      intent: options.intent,
      params: options.params,
      parent: null,
      path: [],
      payload: options.payload,
      unresolvedPane: options.rootPaneNode || loadStructure(),
    }),
    timer(maxTimeout),
  ])

  if (matchingPanes === 'TIMER') {
    console.warn(
      `Intent resolver took longer than ${maxTimeout}ms to resolve and timed out. ` +
        'This may be due a large or infinitely recursive structure. ' +
        'Falling back to the fallback editor…'
    )
    return fallbackEditorPanes
  }

  const closestPaneToRoot = matchingPanes.sort((a, b) => {
    // break ties with the level index
    if (a.depthIndex === b.depthIndex) return a.levelIndex - b.levelIndex
    return a.depthIndex - b.depthIndex
  })[0]

  if (closestPaneToRoot) {
    return closestPaneToRoot.panes
  }

  return fallbackEditorPanes
}
