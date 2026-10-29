import omit from 'lodash-es/omit.js'
import {
  filter,
  firstValueFrom,
  map,
  merge,
  type Observable,
  of,
  scan,
  switchMap,
  take,
  timeout,
} from 'rxjs'

import {type StructureContext} from '../structureBuilder/types'
import {
  type PaneNode,
  type RouterPanes,
  type RouterPaneSiblingContext,
  type UnresolvedPaneNode,
} from '../types'
import {assignId} from './assignId'
import {createPaneResolver, type PaneResolverMiddleware} from './createPaneResolver'
import {memoBind} from './memoBind'

// async structure children that never emit would otherwise block the intent forever
const PANE_RESOLUTION_TIMEOUT_MS = 5_000

interface PaneCandidate {
  unresolvedPane: UnresolvedPaneNode | undefined
  parent: PaneNode | null
  path: string[]
  currentId: string
  flatIndex: number
  levelIndex: number
}

function childCandidates(candidate: PaneCandidate, resolvedPane: PaneNode | null): PaneCandidate[] {
  if (resolvedPane?.type !== 'list' || !resolvedPane.child || !resolvedPane.items) return []

  const unresolvedPane =
    typeof resolvedPane.child === 'function' ? memoBind(resolvedPane, 'child') : resolvedPane.child

  return resolvedPane.items.flatMap((item, levelIndex) => {
    if (item.type === 'divider') return []

    return [
      {
        currentId: item._id || item.id,
        flatIndex: candidate.flatIndex + 1,
        parent: resolvedPane,
        path: [...candidate.path, item.id],
        unresolvedPane,
        levelIndex,
      },
    ]
  })
}

export interface ResolveIntentOptions {
  rootPaneNode?: UnresolvedPaneNode
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
  structureContext: StructureContext
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
 * If a `PaneNode` of type `list` is found, its children are searched on the
 * next level. The search stops at the shallowest match without waiting for
 * panes ordered after it.
 *
 * @see PaneNode
 */
export async function resolveIntent(options: ResolveIntentOptions): Promise<RouterPanes> {
  const {intent, params, payload, structureContext} = options
  const {id: targetId, type: schemaTypeName, ...otherParams} = params
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

  function resolveCandidate(candidate: PaneCandidate): Observable<PaneNode | null> {
    const context: RouterPaneSiblingContext = {
      id: candidate.currentId,
      splitIndex: 0,
      parent: candidate.parent,
      path: candidate.path,
      index: candidate.flatIndex,
      params: {},
      payload: undefined,
      structureContext,
    }

    return resolvePane(candidate.unresolvedPane, context, candidate.flatIndex).pipe(
      timeout({
        first: PANE_RESOLUTION_TIMEOUT_MS,
        with: () => {
          console.warn(
            'Structure pane "%s" did not resolve within %dms while resolving the "%s" intent, skipping it',
            candidate.path.join(' > ') || candidate.currentId,
            PANE_RESOLUTION_TIMEOUT_MS,
            intent,
          )
          return of(null)
        },
      }),
      take(1),
    )
  }

  function findMatch(
    resolvedPane: PaneNode,
    {path, flatIndex}: PaneCandidate,
  ): RouterPanes | undefined {
    // if the resolved pane is a document pane and the pane's ID matches then
    // resolve the intent to the current path
    if (resolvedPane.type === 'document' && resolvedPane.id === targetId) {
      return [
        ...path.slice(0, path.length - 1).map((i) => [{id: i}]),
        [{id: targetId, params: otherParams, payload}],
      ]
    }

    // NOTE: if you update this logic, please also update the similar handler in
    // `getIntentState.ts`
    if (
      // if the resolve pane's `canHandleIntent` returns true, then resolve
      resolvedPane.canHandleIntent?.(intent, params, {
        pane: resolvedPane,
        index: flatIndex,
      }) ||
      // if the pane's `canHandleIntent` did not return true, then match against
      // this default case. we will resolve the intent if:
      (resolvedPane.type === 'documentList' &&
        // 1. the schema type matches (this required for the document to render)
        resolvedPane.schemaTypeName === schemaTypeName &&
        // 2. the filter is the default filter.
        //
        // NOTE: this case is to prevent false positive matches where the user
        // has configured a more specific filter for a particular type. In that
        // case, the user can implement their own `canHandleIntent` function
        resolvedPane.options.filter === '_type == $type')
    ) {
      return [
        // map the current path to router panes
        ...path.map((id) => [{id}]),
        // then augment with the intents IDs and params
        [{id: params.id, params: otherParams, payload}],
      ]
    }

    return undefined
  }

  function decideLevel(
    level: PaneCandidate[],
    priorityOrder: number[],
    settled: Map<number, PaneNode | null>,
  ): {match: RouterPanes | undefined} | undefined {
    for (const index of priorityOrder) {
      if (!settled.has(index)) return undefined

      const resolvedPane = settled.get(index)
      const match = resolvedPane && findMatch(resolvedPane, level[index])
      if (match) return {match}
    }

    return {match: undefined}
  }

  function searchLevel(level: PaneCandidate[]): Observable<RouterPanes | undefined> {
    if (level.length === 0) return of(undefined)

    const priorityOrder = level
      .map((_, index) => index)
      .toSorted((a, b) => level[a].levelIndex - level[b].levelIndex)

    return merge(
      ...level.map((candidate, index) =>
        resolveCandidate(candidate).pipe(map((resolvedPane) => ({index, resolvedPane}))),
      ),
    ).pipe(
      scan(
        (settled, {index, resolvedPane}) => new Map(settled).set(index, resolvedPane),
        new Map<number, PaneNode | null>(),
      ),
      map((settled) => ({settled, decision: decideLevel(level, priorityOrder, settled)})),
      filter(({decision}) => decision !== undefined),
      take(1),
      switchMap(({settled, decision}) =>
        decision?.match
          ? of(decision.match)
          : searchLevel(
              level.flatMap((candidate, index) =>
                childCandidates(candidate, settled.get(index) ?? null),
              ),
            ),
      ),
    )
  }

  const match = await firstValueFrom(
    searchLevel(
      options.rootPaneNode
        ? [
            {
              currentId: 'root',
              flatIndex: 0,
              levelIndex: 0,
              parent: null,
              path: [],
              unresolvedPane: options.rootPaneNode,
            },
          ]
        : [],
    ),
  )

  return match ?? fallbackEditorPanes
}
