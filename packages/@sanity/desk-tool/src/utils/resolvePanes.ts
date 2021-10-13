import {useEffect, useState} from 'react'
import shallowEquals from 'shallow-equals'
import {
  Subscribable,
  Observable,
  defer,
  throwError,
  from,
  of as observableOf,
  Subscription,
  Observer,
} from 'rxjs'
import {map, switchMap, distinctUntilChanged} from 'rxjs/operators'
import leven from 'leven'
import generateHelpUrl from '@sanity/generate-help-url'
import {
  PaneNode,
  PaneChild,
  RouterPanes,
  DocumentPaneNode,
  UnresolvedPaneNode,
  RouterPaneSibling,
  RouterPaneSiblingContext,
  StructureErrorType,
} from '../types'
import {LOADING_PANE} from '../constants'
import {defaultStructure} from '../defaultStructure'
import {isRecord, isSubscribable} from './typePredicates'
import validateStructure from './validateStructure'
import serializeStructure from './serializeStructure'

type ArgType<T> = T extends (...args: infer U) => unknown ? U : never

type FallbackEditorChild = (
  documentId: string,
  context: RouterPaneSiblingContext,
  options: {params: Record<string, string | undefined>; payload: unknown}
) => DocumentPaneNode

const fallbackEditorChild: FallbackEditorChild = (nodeId, _, {params, payload}) => {
  const id = nodeId.replace(/^__edit__/, '')
  const {template, type} = params

  if (!type) {
    throw new Error(
      `Document type for document with ID ${id} was not provided in the router params.`
    )
  }

  const documentPane: DocumentPaneNode = {
    id: 'editor',
    type: 'document',
    title: 'Editor',
    options: {
      id,
      template,
      type,
      templateParameters: payload as Record<string, unknown>,
    },
  }
  return documentPane
}

const KNOWN_STRUCTURE_EXPORTS = ['getDefaultDocumentNode']

declare global {
  const __DEV__: boolean
}

let prevStructureError: StructureErrorType | null = null
if (__DEV__) {
  if (module.hot && module.hot.data) {
    prevStructureError = module.hot.data.prevError
  }

  if (module.hot) {
    module.hot.dispose((data) => {
      data.prevError = prevStructureError
    })
  }
}

export function resolvePanes(
  pane: UnresolvedPaneNode,
  paneGroups: RouterPanes,
  previousPanes: Array<PaneNode | typeof LOADING_PANE>,
  fromIndex: [number, number],
  options: {silent?: boolean} = {}
): Observable<Array<PaneNode | typeof LOADING_PANE>> {
  const pane$ = isSubscribable(pane) ? from(pane) : observableOf(pane as PaneNode)

  return pane$.pipe(
    switchMap((resolvedPane) =>
      resolveForStructure(resolvedPane, paneGroups, previousPanes, fromIndex, options)
    )
  )
}

function getInitialPanes(
  previousPanes: Array<typeof LOADING_PANE | PaneNode> | null,
  numPanes: number,
  fromIndex: number
) {
  const allLoading = new Array(numPanes).fill(LOADING_PANE) as typeof LOADING_PANE[]
  if (!previousPanes) {
    return allLoading
  }

  const remains = previousPanes.slice(0, fromIndex)
  return remains.concat(allLoading.slice(fromIndex))
}

function sumPaneSegments(paneGroups: RouterPanes) {
  return paneGroups.reduce<number>((count, curr) => count + curr.length, 0)
}

function resolveForStructure(
  structure: PaneNode,
  paneGroups: RouterPanes,
  prevStructure: Array<PaneNode | typeof LOADING_PANE>,
  fromIndex: [number, number],
  options: {silent?: boolean} = {}
): Observable<Array<PaneNode | typeof LOADING_PANE>> {
  return Observable.create((observer: Observer<Array<PaneNode | typeof LOADING_PANE>>) => {
    try {
      validateStructure(structure)
    } catch (err) {
      observer.error(err)
      return unsubscribe
    }

    const paneSegments = ([[{id: structure.id}]] as RouterPanes)
      .concat(paneGroups)
      .filter((pair) => pair && pair.length > 0)

    const totalPanes = sumPaneSegments(paneSegments)
    const [fromRootIndex, fromSplitIndex] = fromIndex
    let panes = getInitialPanes(prevStructure, totalPanes, fromRootIndex + 1 + fromSplitIndex)
    const subscriptions: Subscription[] = []

    // Start with all-loading (or previous structure) state
    observer.next(panes)

    const resolveFrom = Math.max(0, panes.indexOf(LOADING_PANE))
    const resolveFromIndex = findSegmentGroupIndexForPaneAtIndex(resolveFrom)

    // Start resolving pane-by-pane
    resolve(resolveFromIndex || 0, fromSplitIndex || 0)

    return unsubscribe

    function resolve(index: number, splitIndex: number) {
      if (index > paneSegments.length - 1) {
        return
      }

      const parent = index === 0 ? null : findParentForSegmentIndex(index - 1)
      const path = paneSegments.slice(0, index + 1).map((segment) => segment[0].id)
      const context: RouterPaneSiblingContext = {parent, index, splitIndex, path}

      if (index === 0) {
        const {id} = paneSegments[index][splitIndex]
        subscribeForUpdates(structure, index, 0, context, [id, context])
        return
      }

      if (!parent || !parent.child) {
        return
      }

      const siblings = paneSegments[index]
      for (let i = splitIndex; i < siblings.length; i++) {
        const {id} = siblings[i]
        const isFallbackEditor = index === 1 && id.startsWith('__edit__')
        const child = isFallbackEditor ? fallbackEditorChild : parent.child
        const resolverArgs = getResolverArgumentsForSibling(siblings[i], context, isFallbackEditor)
        subscribeForUpdates(child, index, i, context, resolverArgs)
      }
    }

    function getResolverArgumentsForSibling(
      sibling: RouterPaneSibling,
      context: RouterPaneSiblingContext,
      isFallbackEditor: boolean
    ) {
      const {id, params = {}, payload} = sibling

      if (isFallbackEditor) {
        const args: ArgType<FallbackEditorChild> = [id, context, {params, payload}]
        return args
      }

      return [id, context] as const
    }

    function subscribeForUpdates(
      pane: PaneChild | FallbackEditorChild,
      groupIndex: number,
      splitIndex: number,
      context: RouterPaneSiblingContext,
      resolverArgs: ReturnType<typeof getResolverArgumentsForSibling>
    ) {
      const source = serializeStructure(
        pane as PaneChild,
        context,
        resolverArgs as [string, RouterPaneSiblingContext]
      )
      subscriptions.push(
        source.subscribe(
          (result) => emit(result, groupIndex, splitIndex),
          (error) => observer.error(error)
        )
      )
    }

    function findSegmentGroupIndexForPaneAtIndex(index: number): number | null {
      for (let i = 0, pane = 0; i < paneSegments.length; i++) {
        for (let x = 0; x < paneSegments[i].length; x++) {
          // eslint-disable-next-line max-depth
          if (pane === index) {
            return i
          }

          pane++
        }
      }

      return null
    }

    function findFlatIndexForPane(index: number, splitIndex: number) {
      if (index === 0) {
        return splitIndex
      }

      let flatIndex = 0
      for (let i = 0; index < paneSegments.length && i <= index; i++) {
        if (i === index) {
          return flatIndex + splitIndex
        }

        flatIndex += paneSegments[i].length
      }

      return null
    }

    function findParentForSegmentIndex(index: number) {
      const parentGroupIndex = findSegmentGroupIndexForPaneAtIndex(index)
      return parentGroupIndex === null ? null : (panes[parentGroupIndex] as PaneNode)
    }

    function emit(pane: PaneNode, index: number, splitIndex: number) {
      if (typeof pane === 'undefined' && !options.silent) {
        // eslint-disable-next-line no-console
        console.warn(
          'Pane at index %d returned no child %s - see %s',
          index,
          splitIndex ? `for split pane index ${splitIndex}` : '',
          generateHelpUrl('structure-item-returned-no-child')
        )
      }

      if (maybeReplacePane(pane, index, splitIndex)) {
        observer.next(panes) // eslint-disable-line callback-return
      }

      if (splitIndex === 0) {
        resolve(index + 1, splitIndex)
      }
    }

    function maybeReplacePane(pane: PaneNode, index: number, splitIndex: number) {
      // `panes` are flat: so we need to figure out the correct index based on the groups
      const flatIndex = findFlatIndexForPane(index, splitIndex)
      if (flatIndex === null) return false

      if (panes[flatIndex] === pane || shallowEquals(panes[flatIndex], pane)) {
        return false
      }

      panes = panes.slice()
      if (pane) {
        panes.splice(flatIndex, 1, pane)
      } else {
        panes.splice(flatIndex)
      }

      return true
    }

    function unsubscribe() {
      while (subscriptions.length) {
        const sub = subscriptions.pop()
        if (sub) sub.unsubscribe()
      }
    }
  })
}

export const maybeSerialize = (
  structure: UnresolvedPaneNode
): PaneNode | Subscribable<PaneNode> | PromiseLike<PaneNode> =>
  structure && 'serialize' in structure
    ? structure.serialize({
        parent: null,
        path: [],
        index: 0,
        splitIndex: 0,
      })
    : structure

// We are lazy-requiring/resolving the structure inside of a function in order to catch errors
// on the root-level of the module. Any loading errors will be caught and emitted as errors
// eslint-disable-next-line complexity
export const loadStructure = (): Observable<UnresolvedPaneNode> => {
  let structure: UnresolvedPaneNode
  try {
    const mod = require('part:@sanity/desk-tool/structure?') || defaultStructure
    structure = mod && mod.__esModule ? mod.default : mod

    warnOnUnknownExports(mod)

    // On invalid modules, when HMR kicks in, we sometimes get an empty object back when the
    // source has changed without fixing the problem. In this case, keep showing the error
    if (
      __DEV__ &&
      prevStructureError &&
      structure &&
      structure.constructor.name === 'Object' &&
      Object.keys(structure).length === 0
    ) {
      return throwError(prevStructureError)
    }

    prevStructureError = null
  } catch (err) {
    prevStructureError = err
    return throwError(err)
  }

  if (!isStructure(structure)) {
    return throwError(
      new Error(
        `Structure needs to export a function, an observable, a promise or a structure builder, got ${typeof structure}`
      )
    )
  }

  const rootContext: RouterPaneSiblingContext = {
    parent: null,
    splitIndex: 0,
    path: [],
    index: 0,
  }

  // Defer to catch immediately thrown errors on serialization
  return defer(() => serializeStructure(structure, rootContext, ['root', rootContext]))
}

export const useStructure = (
  segments: RouterPanes | undefined,
  options = {}
): {
  structure: Array<PaneNode | typeof LOADING_PANE> | undefined
  error: StructureErrorType | undefined
} => {
  const hasSegments = Boolean(segments)
  const numSegments = sumPaneSegments(segments || [])
  const [{structure, error}, setStructure] = useState<{
    structure?: Array<PaneNode | typeof LOADING_PANE>
    error?: StructureErrorType
  }>({})

  // @todo This leads to deep update loops unless we serialize paneSegments
  // @todo We should try to memoize/prevent this without resorting to JSON.stringify
  useEffect(() => {
    if (!hasSegments) {
      return () => null
    }

    setStructure({structure: getInitialPanes(null, numSegments, 0)})
    const subscription = loadStructure()
      .pipe(
        distinctUntilChanged(),
        map(maybeSerialize),
        switchMap((newStructure) =>
          resolvePanes(newStructure, segments || [], structure || [], [0, 0], options)
        )
      )
      .subscribe(
        (newStructure) => setStructure({structure: newStructure}),
        (resolveError) => setStructure({error: resolveError})
      )

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(segments)])

  return {structure, error}
}

export const setStructureResolveError = (err: StructureErrorType): void => {
  prevStructureError = err
}

function isStructure(structure: unknown): structure is UnresolvedPaneNode {
  return (
    isRecord(structure) &&
    (typeof structure === 'function' ||
      typeof structure.serialize !== 'function' ||
      typeof structure.then !== 'function' ||
      typeof structure.subscribe !== 'function' ||
      typeof structure.type !== 'string')
  )
}

function warnOnUnknownExports(mod: Record<string, unknown>) {
  if (!mod) {
    return
  }

  const known = KNOWN_STRUCTURE_EXPORTS.concat('default')
  const keys = Object.keys(mod)
  keys
    .filter((key) => !known.includes(key))
    .forEach((key) => {
      const {closest} = known.reduce<{closest: any; distance: number}>(
        (acc, current) => {
          const distance = leven(current, key)
          return distance < 3 && distance < acc.distance ? {closest: current, distance} : acc
        },
        {closest: null, distance: +Infinity}
      )

      const hint = closest ? ` - did you mean "${closest}"` : ''

      // eslint-disable-next-line
      console.warn(`Unknown structure export "${key}"${hint}`)
    })
}
