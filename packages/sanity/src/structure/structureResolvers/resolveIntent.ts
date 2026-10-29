import omit from 'lodash-es/omit.js'
import {
  combineLatest,
  filter,
  firstValueFrom,
  map,
  merge,
  type Observable,
  of,
  scan,
  shareReplay,
  startWith,
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

const DEEPER_PENDING = Symbol('deeperPending')

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
  params: {type?: string; id: string; [key: string]: string | undefined}
  /** The document's type, for when `params.type` isn't known yet. */
  documentType?: Observable<string>
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
  const {id: targetId, type, ...otherParams} = params
  const documentType$ = (options.documentType ?? of(type)).pipe(
    take(1),
    shareReplay({bufferSize: 1, refCount: true}),
  )
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
    schemaTypeName: string | undefined,
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
      resolvedPane.canHandleIntent?.(
        intent,
        {...params, type: schemaTypeName},
        {
          pane: resolvedPane,
          index: flatIndex,
        },
      ) ||
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
    schemaTypeName: string | undefined,
  ): {match: RouterPanes | undefined} | undefined {
    for (const index of priorityOrder) {
      if (!settled.has(index)) return undefined

      const resolvedPane = settled.get(index)
      const match = resolvedPane && findMatch(resolvedPane, level[index], schemaTypeName)
      if (match) return {match}
    }

    return {match: undefined}
  }

  function searchLevel(level: PaneCandidate[]): Observable<RouterPanes | undefined> {
    if (level.length === 0) return of(undefined)

    const priorityOrder = level
      .map((_, index) => index)
      .toSorted((a, b) => level[a].levelIndex - level[b].levelIndex)

    const settled$ = merge(
      ...level.map((candidate, index) =>
        resolveCandidate(candidate).pipe(map((resolvedPane) => ({index, resolvedPane}))),
      ),
    ).pipe(
      scan(
        (settled, {index, resolvedPane}) => new Map(settled).set(index, resolvedPane),
        new Map<number, PaneNode | null>(),
      ),
      shareReplay({bufferSize: 1, refCount: true}),
    )

    const levelMatch$ = combineLatest([settled$, documentType$]).pipe(
      map(([settled, schemaTypeName]) =>
        decideLevel(level, priorityOrder, settled, schemaTypeName),
      ),
      filter((decision) => decision !== undefined),
      take(1),
    )

    // the next level doesn't need the document type, so it starts while the type is loading
    const deeperMatch$ = settled$.pipe(
      filter((settled) => settled.size === level.length),
      take(1),
      switchMap((settled) =>
        searchLevel(
          level.flatMap((candidate, index) =>
            childCandidates(candidate, settled.get(index) ?? null),
          ),
        ),
      ),
      startWith(DEEPER_PENDING),
    )

    return combineLatest([levelMatch$, deeperMatch$]).pipe(
      map(([{match}, deeperMatch]) => match ?? deeperMatch),
      filter((result): result is RouterPanes | undefined => result !== DEEPER_PENDING),
      take(1),
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

  return (
    match ?? [
      [
        {
          id: `__edit__${options.params.id}`,
          params: {...omit(options.params, ['id']), type: await firstValueFrom(documentType$)},
          payload: options.payload,
        },
      ],
    ]
  )
}
