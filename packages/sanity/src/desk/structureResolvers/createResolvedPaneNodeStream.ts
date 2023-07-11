import {generateHelpUrl} from '@sanity/generate-help-url'
import {isEqual} from 'lodash'
import {Observable, NEVER, of as observableOf, concat} from 'rxjs'
import {switchMap, map, scan, distinctUntilChanged, pairwise, startWith} from 'rxjs/operators'
import {
  DocumentPaneNode,
  PaneNode,
  RouterPaneSiblingContext,
  RouterPanes,
  RouterPaneSibling,
  PaneNodeResolver,
  UnresolvedPaneNode,
} from '../types'
import {StructureContext} from '../structureBuilder'
import {assignId} from './assignId'
import {createPaneResolver, PaneResolver, PaneResolverMiddleware} from './createPaneResolver'
import {memoBind} from './memoBind'
import {PaneResolutionError} from './PaneResolutionError'

/**
 * the fallback editor child that is implicitly inserted into the structure tree
 * if the id starts with `__edit__`
 */
const fallbackEditorChild: PaneNodeResolver = (nodeId, context): DocumentPaneNode => {
  const id = nodeId.replace(/^__edit__/, '')
  const {
    params,
    payload,
    structureContext: {resolveDocumentNode},
  } = context
  const {type, template} = params

  if (!type) {
    throw new Error(
      `Document type for document with ID ${id} was not provided in the router params.`
    )
  }

  let defaultDocumentBuilder = resolveDocumentNode({schemaType: type, documentId: id}).id('editor')

  if (template) {
    defaultDocumentBuilder = defaultDocumentBuilder.initialValueTemplate(
      template,
      payload as {[key: string]: unknown}
    )
  }

  return defaultDocumentBuilder.serialize() as DocumentPaneNode
}

/**
 * takes in a `RouterPaneSiblingContext` and returns a normalized string
 * representation that can be used for comparisons
 */
function hashContext(context: RouterPaneSiblingContext): string {
  return `contextHash(${JSON.stringify({
    id: context.id,
    parentId: parent && assignId(parent),
    path: context.path,
    index: context.index,
    splitIndex: context.splitIndex,
    serializeOptionsIndex: context.serializeOptions?.index,
    serializeOptionsPath: context.serializeOptions?.path,
  })})`
}

/**
 * takes in `ResolvedPaneMeta` and returns a normalized string representation
 * that can be used for comparisons
 */
const hashResolvedPaneMeta = (meta: ResolvedPaneMeta): string => {
  const normalized = {
    type: meta.type,
    id: meta.routerPaneSibling.id,
    params: meta.routerPaneSibling.params || {},
    payload: meta.routerPaneSibling.payload || null,
    flatIndex: meta.flatIndex,
    groupIndex: meta.groupIndex,
    siblingIndex: meta.siblingIndex,
    path: meta.path,
    paneNode: meta.type === 'resolvedMeta' ? assignId(meta.paneNode) : null,
  }

  return `metaHash(${JSON.stringify(normalized)})`
}

/**
 * Represents one flattened "router pane", including the source group and
 * sibling indexes.
 *
 * @see RouterPanes
 */
interface FlattenedRouterPane {
  routerPaneSibling: RouterPaneSibling
  flatIndex: number
  groupIndex: number
  siblingIndex: number
}

/**
 * The state of the accumulator used to store and manage memo cache state
 */
interface CacheState {
  /**
   * Holds the memoization results keyed by a combination of `assignId` and a
   * context hash.
   */
  resolvedPaneCache: Map<string, Observable<PaneNode>>
  /**
   * Acts as a dictionary that stores cache keys by their flat index. This is
   * used to clean up the cache between different branches in the pane
   * structure.
   *
   * @see createResolvedPaneNodeStream look inside the `scan` where `wrapFn` is
   * defined
   */
  cacheKeysByFlatIndex: Array<Set<string>>
  /**
   * The resulting memoized `PaneResolver` function. This function closes over
   * the `resolvedPaneCache`.
   */
  resolvePane: PaneResolver
  flattenedRouterPanes: FlattenedRouterPane[]
}

export interface CreateResolvedPaneNodeStreamOptions {
  /**
   * an input stream of `RouterPanes`
   * @see RouterPanes
   */
  routerPanesStream: Observable<RouterPanes>
  /**
   * any `UnresolvedPaneNode` (could be an observable, promise, pane resolver etc)
   */
  rootPaneNode: UnresolvedPaneNode
  /** used primarily for testing */
  initialCacheState?: CacheState

  structureContext: StructureContext
}

/**
 * The result of pane resolving
 */
export type ResolvedPaneMeta = {
  groupIndex: number
  siblingIndex: number
  flatIndex: number
  routerPaneSibling: RouterPaneSibling
  path: string[]
} & ({type: 'loading'; paneNode: null} | {type: 'resolvedMeta'; paneNode: PaneNode})

interface ResolvePaneTreeOptions {
  resolvePane: PaneResolver
  flattenedRouterPanes: FlattenedRouterPane[]
  unresolvedPane: UnresolvedPaneNode | undefined
  parent: PaneNode | null
  path: string[]
  structureContext: StructureContext
}

/**
 * A recursive pane resolving function. Starts at one unresolved pane node and
 * continues until there is no more flattened router panes that can be used as
 * input to the unresolved panes.
 */
function resolvePaneTree({
  unresolvedPane,
  flattenedRouterPanes,
  parent,
  path,
  resolvePane,
  structureContext,
}: ResolvePaneTreeOptions): Observable<ResolvedPaneMeta[]> {
  const [current, ...rest] = flattenedRouterPanes
  const next = rest[0] as FlattenedRouterPane | undefined

  const context: RouterPaneSiblingContext = {
    id: current.routerPaneSibling.id,
    splitIndex: current.siblingIndex,
    parent,
    path: [...path, current.routerPaneSibling.id],
    index: current.flatIndex,
    params: current.routerPaneSibling.params || {},
    payload: current.routerPaneSibling.payload,
    structureContext,
  }

  try {
    return resolvePane(unresolvedPane, context, current.flatIndex).pipe(
      // this switch map receives a resolved pane
      switchMap((paneNode) => {
        // we can create a `resolvedMeta` type using it
        const resolvedPaneMeta: ResolvedPaneMeta = {
          type: 'resolvedMeta',
          ...current,
          paneNode: paneNode,
          path: context.path,
        }

        // for the other unresolved panes, we can create "loading panes"
        const loadingPanes = rest.map((i, restIndex) => {
          const loadingPanePath = [
            ...context.path,
            ...rest.slice(restIndex).map((_, currentIndex) => `[${i.flatIndex + currentIndex}]`),
          ]

          const loadingPane: ResolvedPaneMeta = {
            type: 'loading',
            path: loadingPanePath,
            paneNode: null,
            ...i,
          }

          return loadingPane
        })

        if (!rest.length) {
          return observableOf([resolvedPaneMeta])
        }

        let nextStream

        if (
          // the fallback editor case
          next?.routerPaneSibling.id.startsWith('__edit__')
        ) {
          nextStream = resolvePaneTree({
            unresolvedPane: fallbackEditorChild,
            flattenedRouterPanes: rest,
            parent,
            path: context.path,
            resolvePane,
            structureContext,
          })
        } else if (current.groupIndex === next?.groupIndex) {
          // if the next flattened router pane has the same group index as the
          // current flattened router pane, then the next flattened router pane
          // belongs to the same group (i.e. it is a split pane)
          nextStream = resolvePaneTree({
            unresolvedPane,
            flattenedRouterPanes: rest,
            parent,
            path,
            resolvePane,
            structureContext,
          })
        } else {
          // normal children resolving
          nextStream = resolvePaneTree({
            unresolvedPane:
              typeof paneNode.child === 'function'
                ? (memoBind(paneNode, 'child') as PaneNodeResolver)
                : paneNode.child,
            flattenedRouterPanes: rest,
            parent: paneNode,
            path: context.path,
            resolvePane,
            structureContext,
          })
        }

        return concat(
          // we emit the loading panes first in a concat (this emits immediately)
          observableOf([resolvedPaneMeta, ...loadingPanes]),
          // then whenever the next stream is done, the results will be combined.
          nextStream.pipe(map((nextResolvedPanes) => [resolvedPaneMeta, ...nextResolvedPanes]))
        )
      })
    )
  } catch (e) {
    if (e instanceof PaneResolutionError) {
      if (e.context) {
        console.warn(
          `Pane resolution error at index ${e.context.index}${
            e.context.splitIndex > 0 ? ` for split pane index ${e.context.splitIndex}` : ''
          }: ${e.message}${e.helpId ? ` - see ${generateHelpUrl(e.helpId)}` : ''}`,
          e
        )
      }

      if (e.helpId === 'structure-item-returned-no-child') {
        // returning an observable of an empty array will remove loading panes
        // note: this one intentionally does not throw
        return observableOf([])
      }
    }

    throw e
  }
}

/**
 * Takes in a stream of `RouterPanes` and an unresolved root pane and returns
 * a stream of `ResolvedPaneMeta`
 */
export function createResolvedPaneNodeStream({
  routerPanesStream,
  rootPaneNode,
  initialCacheState = {
    cacheKeysByFlatIndex: [],
    flattenedRouterPanes: [],
    resolvedPaneCache: new Map(),
    resolvePane: () => NEVER,
  },
  structureContext,
}: CreateResolvedPaneNodeStreamOptions): Observable<ResolvedPaneMeta[]> {
  const resolvedPanes$ = routerPanesStream.pipe(
    // add in implicit "root" router pane
    map((rawRouterPanes) => [[{id: 'root'}], ...rawRouterPanes]),
    // create flattened router panes
    map((routerPanes) => {
      const flattenedRouterPanes: FlattenedRouterPane[] = routerPanes
        .flatMap((routerPaneGroup, groupIndex) =>
          routerPaneGroup.map((routerPaneSibling, siblingIndex) => ({
            routerPaneSibling,
            groupIndex,
            siblingIndex,
          }))
        )
        // add in the flat index
        .map((i, index) => ({...i, flatIndex: index}))

      return flattenedRouterPanes
    }),
    // calculate a "diffIndex" used for clearing the memo cache
    startWith([] as FlattenedRouterPane[]),
    pairwise(),
    map(([prev, curr]) => {
      for (let i = 0; i < curr.length; i++) {
        const prevValue = prev[i]
        const currValue = curr[i]

        if (!isEqual(prevValue, currValue)) {
          return {
            flattenedRouterPanes: curr,
            diffIndex: i,
          }
        }
      }

      return {
        flattenedRouterPanes: curr,
        diffIndex: curr.length,
      }
    }),
    // create the memoized `resolvePane` function and manage the memo cache
    scan((acc, next) => {
      const {cacheKeysByFlatIndex, resolvedPaneCache} = acc
      const {flattenedRouterPanes, diffIndex} = next

      // use the `cacheKeysByFlatIndex` like a dictionary to find cache keys to
      // and cache keys to delete
      const beforeDiffIndex = cacheKeysByFlatIndex.slice(0, diffIndex + 1)
      const afterDiffIndex = cacheKeysByFlatIndex.slice(diffIndex + 1)

      const keysToKeep = new Set(beforeDiffIndex.flatMap((keySet) => Array.from(keySet)))
      const keysToDelete = afterDiffIndex
        .flatMap((keySet) => Array.from(keySet))
        .filter((key) => !keysToKeep.has(key))

      for (const key of keysToDelete) {
        resolvedPaneCache.delete(key)
      }

      // create a memoizing pane resolver middleware that utilizes the cache
      // maintained above. this keeps the cache from growing indefinitely
      const memoize: PaneResolverMiddleware = (nextFn) => (unresolvedPane, context, flatIndex) => {
        const key = unresolvedPane && `${assignId(unresolvedPane)}-${hashContext(context)}`
        const cachedResolvedPane = key && resolvedPaneCache.get(key)
        if (cachedResolvedPane) return cachedResolvedPane

        const result = nextFn(unresolvedPane, context, flatIndex)
        if (!key) return result

        const cacheKeySet = cacheKeysByFlatIndex[flatIndex] || new Set()
        cacheKeySet.add(key)
        cacheKeysByFlatIndex[flatIndex] = cacheKeySet
        resolvedPaneCache.set(key, result)
        return result
      }

      return {
        flattenedRouterPanes,
        cacheKeysByFlatIndex,
        resolvedPaneCache,
        resolvePane: createPaneResolver(memoize),
      }
    }, initialCacheState),
    // run the memoized, recursive resolving
    switchMap(({flattenedRouterPanes, resolvePane}) =>
      resolvePaneTree({
        unresolvedPane: rootPaneNode,
        flattenedRouterPanes,
        parent: null,
        path: [],
        resolvePane,
        structureContext,
      })
    )
  )

  // after we've created a stream of `ResolvedPaneMeta[]`, we need to clean up
  // the results to remove unwanted loading panes and prevent unnecessary
  // emissions
  return resolvedPanes$.pipe(
    // this diffs the previous emission with the current one. if there is a new
    // loading pane at the same position where a previous pane already had a
    // resolved value (looking at the IDs to compare), then return the previous
    // pane instead of the loading pane
    scan(
      (prev, next) =>
        next.map((nextPane, index) => {
          const prevPane = prev[index] as ResolvedPaneMeta | undefined
          if (!prevPane) return nextPane
          if (nextPane.type !== 'loading') return nextPane

          if (prevPane.routerPaneSibling.id === nextPane.routerPaneSibling.id) {
            return prevPane
          }
          return nextPane
        }),
      [] as ResolvedPaneMeta[]
    ),
    // this prevents duplicate emissions
    distinctUntilChanged((prev, next) => {
      if (prev.length !== next.length) return false

      for (let i = 0; i < next.length; i++) {
        const prevValue = prev[i]
        const nextValue = next[i]
        if (hashResolvedPaneMeta(prevValue) !== hashResolvedPaneMeta(nextValue)) {
          return false
        }
      }

      return true
    })
  )
}
