import omit from 'lodash-es/omit.js'
import {firstValueFrom, Observable, of, take, timeout, type Observer, type Subscription} from 'rxjs'

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
  /** The depth of the pane, which is also its index in the router panes. */
  flatIndex: number
  /** The index of the pane's item in its parent list at every depth. */
  position: number[]
  /** Set once the pane has resolved or failed. */
  result?: {pane: PaneNode | null} | {error: unknown}
  /** Set once the resolved pane has been checked against the intent. */
  evaluation?: {match: RouterPanes | undefined} | {error: unknown}
  subscription?: Subscription
}

interface SearchLevel {
  candidates: PaneCandidate[]
  /** How many candidates have not resolved or failed yet. */
  pending: number
  /** No more candidates can be added, because every pane on the level above has resolved. */
  complete: boolean
  /** The candidates by priority, sorted once the level is complete. */
  ordered?: PaneCandidate[]
  /** The index in `ordered` of the first candidate that hasn't been ruled out. */
  cursor: number
}

type SearchResult = {match: RouterPanes | undefined; schemaTypeName: string | undefined}

/**
 * The shallowest match wins, then the one with the lowest index in its parent list, then the
 * one that comes first in the structure.
 */
function comparePriority(a: PaneCandidate, b: PaneCandidate): number {
  const levelIndexDifference = a.position[a.position.length - 1] - b.position[b.position.length - 1]
  if (levelIndexDifference !== 0) return levelIndexDifference

  for (let i = 0; i < a.position.length; i++) {
    if (a.position[i] !== b.position[i]) return a.position[i] - b.position[i]
  }
  return 0
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
        position: [...candidate.position, levelIndex],
        unresolvedPane,
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
 * next level. Panes resolve concurrently, deeper ones included, and the search
 * stops at the shallowest match without waiting for panes ordered after it.
 *
 * @see PaneNode
 */
export async function resolveIntent(options: ResolveIntentOptions): Promise<RouterPanes> {
  const {intent, params, payload, structureContext} = options
  const {id: targetId, type, ...otherParams} = params
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

  /**
   * Every pane resolves as soon as its parent has, so a slow pane only holds up the panes below
   * it. Each pane is checked against the intent once, and a level is decided in priority order
   * as far as its resolved panes allow, so the search settles as soon as nothing that resolves
   * later could beat the best match. An error only fails the search when it is in the way of
   * that decision.
   */
  function search(observer: Observer<SearchResult>): () => void {
    let typeSubscription: Subscription | undefined
    const levels: SearchLevel[] = []
    const queue: PaneCandidate[] = []
    let queueIndex = 0
    let decidedDepth = 0
    // no pane deeper than the shallowest known match can win, so those are never resolved
    let matchDepth = Infinity
    let typeState: {schemaTypeName: string | undefined} | undefined
    let pumping = false
    let done = false

    function getLevel(depth: number): SearchLevel {
      levels[depth] ??= {candidates: [], pending: 0, complete: false, cursor: 0}
      return levels[depth]
    }

    function add(candidate: PaneCandidate) {
      const level = getLevel(candidate.flatIndex)
      level.candidates.push(candidate)
      level.pending++
      queue.push(candidate)
    }

    function markComplete(depth: number) {
      for (let level = getLevel(depth); ; level = getLevel(++depth)) {
        level.complete = true
        // a level without candidates has no children, so every level below it is empty too
        if (level.candidates.length === 0 || level.pending > 0) return
      }
    }

    function evaluate(
      candidate: PaneCandidate,
      pane: PaneNode | null,
      schemaTypeName: string | undefined,
    ): NonNullable<PaneCandidate['evaluation']> {
      if (!candidate.evaluation) {
        try {
          const match = pane ? findMatch(pane, candidate, schemaTypeName) : undefined
          if (match) matchDepth = Math.min(matchDepth, candidate.flatIndex)
          candidate.evaluation = {match}
        } catch (error) {
          candidate.evaluation = {error}
        }
      }
      return candidate.evaluation
    }

    function settle(candidate: PaneCandidate, result: NonNullable<PaneCandidate['result']>) {
      if (done || candidate.result) return

      candidate.result = result
      if ('pane' in result) {
        const evaluation = typeState && evaluate(candidate, result.pane, typeState.schemaTypeName)
        // while the type is unknown, the panes below a pane that may match are resolved too
        if (!evaluation || ('match' in evaluation && !evaluation.match)) {
          for (const child of childCandidates(candidate, result.pane)) add(child)
        }
      }

      const level = getLevel(candidate.flatIndex)
      level.pending--
      if (level.complete && level.pending === 0) markComplete(candidate.flatIndex + 1)
      pump()
    }

    function start(candidate: PaneCandidate) {
      let resolvedPane$: Observable<PaneNode | null>
      try {
        resolvedPane$ = resolveCandidate(candidate)
      } catch (error) {
        settle(candidate, {error})
        return
      }

      candidate.subscription = resolvedPane$.subscribe({
        next: (pane) => settle(candidate, {pane}),
        error: (error) => settle(candidate, {error}),
        // a pane that completes without a value is skipped, like one that times out
        complete: () => settle(candidate, {pane: null}),
      })
    }

    function unsubscribe() {
      typeSubscription?.unsubscribe()
      for (let i = 0; i < queueIndex && i < queue.length; i++) queue[i].subscription?.unsubscribe()
    }

    function decide(): {result: SearchResult} | {error: unknown} | undefined {
      for (; ; decidedDepth++) {
        const level = levels[decidedDepth]
        if (!level?.complete) return undefined
        if (level.candidates.length === 0) {
          return typeState ? {result: {match: undefined, ...typeState}} : undefined
        }

        level.ordered ??= level.candidates.toSorted(comparePriority)
        for (; level.cursor < level.ordered.length; level.cursor++) {
          const {result} = level.ordered[level.cursor]
          if (!result) return undefined
          if ('error' in result) return {error: result.error}
          if (!typeState) return undefined

          const {schemaTypeName} = typeState
          const evaluation = evaluate(level.ordered[level.cursor], result.pane, schemaTypeName)
          if ('error' in evaluation) return evaluation
          if (evaluation.match) return {result: {match: evaluation.match, schemaTypeName}}
        }
      }
    }

    function finish(decision: {result: SearchResult} | {error: unknown}) {
      done = true
      unsubscribe()
      if ('error' in decision) {
        observer.error(decision.error)
      } else {
        observer.next(decision.result)
        observer.complete()
      }
    }

    function pump() {
      if (pumping || done) return
      pumping = true
      try {
        while (!done) {
          const decision = decide()
          if (decision) {
            finish(decision)
            return
          }

          const candidate = queue[queueIndex++]
          if (!candidate) {
            queueIndex = queue.length
            return
          }
          if (candidate.flatIndex <= matchDepth) start(candidate)
        }
      } finally {
        pumping = false
      }
    }

    typeSubscription = (options.documentType ?? of(type)).pipe(take(1)).subscribe({
      next: (schemaTypeName) => {
        typeState = {schemaTypeName}
        pump()
      },
      error: (error) => {
        if (!done) finish({error})
      },
      complete: () => {
        if (!done && !typeState) {
          finish({error: new Error('The document type lookup completed without a value')})
        }
      },
    })

    if (options.rootPaneNode) {
      add({
        currentId: 'root',
        flatIndex: 0,
        parent: null,
        path: [],
        position: [0],
        unresolvedPane: options.rootPaneNode,
      })
    }
    markComplete(0)
    pump()

    return unsubscribe
  }

  const {match, schemaTypeName} = await firstValueFrom(new Observable<SearchResult>(search))

  return (
    match ?? [
      [
        {
          id: `__edit__${options.params.id}`,
          params: {...omit(options.params, ['id']), type: schemaTypeName},
          payload: options.payload,
        },
      ],
    ]
  )
}
