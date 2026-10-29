import omit from 'lodash-es/omit.js'
import {filter, firstValueFrom, map, merge, type Observable, of, scan, take, timeout} from 'rxjs'

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

interface ResolvedCandidate {
  candidate: PaneCandidate
  pane: PaneNode | null
}

type LevelOutcome = {match: RouterPanes} | {resolved: ResolvedCandidate[]}

function childCandidates({candidate, pane}: ResolvedCandidate): PaneCandidate[] {
  if (!pane || pane.type !== 'list' || !pane.child || !pane.items) return []

  const unresolvedChild = typeof pane.child === 'function' ? memoBind(pane, 'child') : pane.child

  return pane.items.flatMap((item, levelIndex) => {
    if (item.type === 'divider') return []

    return [
      {
        currentId: item._id || item.id,
        flatIndex: candidate.flatIndex + 1,
        parent: pane,
        path: [...candidate.path, item.id],
        unresolvedPane: unresolvedChild,
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
        id: `__edit__${targetId}`,
        params: {...omit(params, ['id']), type: schemaTypeName},
        payload,
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

  function findMatch(pane: PaneNode, candidate: PaneCandidate): RouterPanes | undefined {
    const {path, flatIndex} = candidate

    // if the resolved pane is a document pane and the pane's ID matches then
    // resolve the intent to the current path
    if (pane.type === 'document' && pane.id === targetId) {
      return [
        ...path.slice(0, path.length - 1).map((i) => [{id: i}]),
        [{id: targetId, params: otherParams, payload}],
      ]
    }

    // NOTE: if you update this logic, please also update the similar handler in
    // `getIntentState.ts`
    if (
      // if the resolve pane's `canHandleIntent` returns true, then resolve
      pane.canHandleIntent?.(intent, params, {pane, index: flatIndex}) ||
      // if the pane's `canHandleIntent` did not return true, then match against
      // this default case. we will resolve the intent if:
      (pane.type === 'documentList' &&
        // 1. the schema type matches (this required for the document to render)
        pane.schemaTypeName === schemaTypeName &&
        // 2. the filter is the default filter.
        //
        // NOTE: this case is to prevent false positive matches where the user
        // has configured a more specific filter for a particular type. In that
        // case, the user can implement their own `canHandleIntent` function
        pane.options.filter === '_type == $type')
    ) {
      return [
        // map the current path to router panes
        ...path.map((id) => [{id}]),
        // then augment with the intents IDs and params
        [{id: targetId, params: otherParams, payload}],
      ]
    }

    return undefined
  }

  function decideLevel(
    level: PaneCandidate[],
    priorityOrder: number[],
    settled: Map<number, PaneNode | null>,
  ): LevelOutcome | undefined {
    for (const index of priorityOrder) {
      if (!settled.has(index)) return undefined

      const pane = settled.get(index)
      const match = pane && findMatch(pane, level[index])
      if (match) return {match}
    }

    return {
      resolved: level.map((candidate, index) => ({candidate, pane: settled.get(index) ?? null})),
    }
  }

  function resolveLevel(level: PaneCandidate[]): Promise<LevelOutcome> {
    const priorityOrder = level
      .map((_, index) => index)
      .toSorted((a, b) => level[a].levelIndex - level[b].levelIndex)

    return firstValueFrom(
      merge(
        ...level.map((candidate, index) =>
          resolveCandidate(candidate).pipe(map((pane) => ({index, pane}))),
        ),
      ).pipe(
        scan(
          (settled, {index, pane}) => new Map(settled).set(index, pane),
          new Map<number, PaneNode | null>(),
        ),
        map((settled) => decideLevel(level, priorityOrder, settled)),
        filter((outcome) => outcome !== undefined),
      ),
    )
  }

  let level: PaneCandidate[] = options.rootPaneNode
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
    : []

  while (level.length > 0) {
    // oxlint-disable-next-line no-await-in-loop -- each level is built from the panes resolved on the previous one
    const outcome = await resolveLevel(level)
    if ('match' in outcome) return outcome.match

    level = outcome.resolved.flatMap(childCandidates)
  }

  return fallbackEditorPanes
}
