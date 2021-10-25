/* eslint-disable complexity */
import {omit} from 'lodash'
import {Observable} from 'rxjs'
import {first} from 'rxjs/operators'
import {PaneNode, RouterPanes, RouterPaneSiblingContext, UnresolvedPaneNode} from '../types'
import {assignId} from './assignId'
import {createPaneResolver, PaneResolverMiddleware} from './createPaneResolver'
import {loadStructure} from './loadStructure'
import {memoBind} from './memoBind'

interface NodeContext {
  unresolvedPane: UnresolvedPaneNode | undefined
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
  parent: PaneNode | null
  path: string[]
  currentId: string
  flatIndex: number
}

export interface ResolveIntentOptions {
  rootPaneNode?: UnresolvedPaneNode
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
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
 * If a `PaneNode` of type `list` is found, it will be searched for a match.
 *
 * @see PaneNode
 */
export async function resolveIntent(options: ResolveIntentOptions): Promise<RouterPanes> {
  const resolvedPaneCache = new Map<string, Observable<PaneNode>>()

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

  const queue: string[] = ['']
  const visited = new Map<string, NodeContext>().set('', {
    currentId: 'root',
    flatIndex: 0,
    intent: options.intent,
    params: options.params,
    parent: null,
    path: [],
    payload: options.payload,
    unresolvedPane: options.rootPaneNode || loadStructure(),
  })

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = queue.shift()
    // if this occurs, then we've exhausted the whole tree
    if (key === undefined) return fallbackEditorPanes

    const {
      currentId,
      flatIndex,
      intent,
      params,
      parent,
      path,
      payload,
      unresolvedPane,
    } = visited.get(key) as NodeContext

    if (!unresolvedPane) continue

    const {id: targetId, type: schemaTypeName, ...otherParams} = params
    const context: RouterPaneSiblingContext = {
      id: currentId,
      splitIndex: 0,
      parent,
      path,
      index: flatIndex,
      params: {},
      payload: undefined,
    }
    const resolvedPane = await resolvePane(unresolvedPane, context, flatIndex)
      .pipe(first())
      .toPromise()

    // if the resolved pane is a document pane and the pane's ID matches
    if (resolvedPane.type === 'document' && resolvedPane.id === targetId) {
      return [
        ...path.slice(0, path.length - 1).map((i) => [{id: i}]),
        [{id: targetId, params: otherParams, payload}],
      ]
    } else if (
      // if the resolved pane is a document list and the schema type matches
      (resolvedPane.type === 'documentList' && resolvedPane.schemaTypeName === schemaTypeName) ||
      // OR
      // if the pane can handle the intent
      resolvedPane.canHandleIntent?.(intent, params, {
        pane: resolvedPane,
        index: flatIndex,
      })
    ) {
      return [
        // map the current path to router panes
        ...path.map((id) => [{id}]),
        // then augment with the intents IDs and params
        [{id: params.id, params: otherParams, payload}],
      ]
    } else if (resolvedPane.type === 'list' && resolvedPane.child && resolvedPane.items) {
      for (const item of resolvedPane.items) {
        if (item.type === 'divider') continue

        const nextPath = [...path, item.id]
        const nextKey = nextPath.join('__')

        if (!visited.has(nextKey)) {
          const nextValue: NodeContext = {
            currentId: item._id || item.id,
            flatIndex: flatIndex + 1,
            intent,
            params,
            parent: resolvedPane,
            path: nextPath,
            payload,
            unresolvedPane:
              typeof resolvedPane.child === 'function'
                ? memoBind(resolvedPane, 'child')
                : resolvedPane.child,
          }

          visited.set(nextKey, nextValue)
          queue.push(nextKey)
        }
      }
    }
  }
}
