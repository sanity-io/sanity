/* eslint-disable @typescript-eslint/ban-types */
import {Observable, Subscribable, from as observableFrom, of as observableOf} from 'rxjs'
import leven from 'leven'
import {switchMap} from 'rxjs/operators'
import {
  DocumentPaneNode,
  PaneNode,
  PaneNodeResolver,
  RouterPaneSiblingContext,
  UnresolvedPaneNode,
} from '../types'
import {defaultStructure} from '../defaultStructure'
import type {ResolvedPaneMeta} from './createResolvedPaneNodeStream'

const bindCache = new WeakMap<object, Map<string, Function>>()

/**
 * An alternative to `obj.method.bind(obj)` that utilizes a weakmap to return
 * the same memory reference for sequent binds.
 */
export function memoBind<
  T extends object,
  K extends keyof {[P in keyof T]: T[P] extends Function ? T[P] : never}
>(obj: T, methodKey: K): T[K]
export function memoBind(obj: Record<string, unknown>, methodKey: string): Function {
  const boundMethods = bindCache.get(obj) || new Map<string, Function>()
  if (boundMethods) {
    const bound = boundMethods.get(methodKey)
    if (bound) return bound
  }

  const method = obj[methodKey]

  if (typeof method !== 'function') {
    throw new Error(
      `Expected property \`${methodKey}\` to be a function but got ${typeof method} instead.`
    )
  }

  const bound = (...args: never[]) => method.call(obj, ...args)
  boundMethods.set(methodKey, bound)
  bindCache.set(obj, boundMethods)

  return bound
}

/**
 * takes in a `RouterPaneSiblingContext` and returns a normalized string
 * representation that can be used for comparisons
 */
export function hashContext(context: RouterPaneSiblingContext): string {
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
export const hashResolvedPaneMeta = (meta: ResolvedPaneMeta): string => {
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
 * the fallback editor child that is implicitly inserted into the structure tree
 * if the id starts with `__edit__`
 */
export const fallbackEditorChild: PaneNodeResolver = (nodeId, context) => {
  const id = nodeId.replace(/^__edit__/, '')
  const {params, payload} = context
  const {type, template} = params

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

// `WeakMap`s require the first type param to extend `object`
// eslint-disable-next-line @typescript-eslint/ban-types
const randomIdCache = new WeakMap<object, string>()

/**
 * a simply random ID function. this doesn't need to be secure but should have a
 * decent amount of entropy
 */
function randomId(len = 8): string {
  if (len <= 0) return ''
  return Math.floor(Math.random() * 16).toString(16) + randomId(len - 1)
}

/**
 * given an object, this function randomly generates an ID and returns it. this
 * result is then saved in a WeakMap so subsequent requests for the same object
 * will receive the same ID
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function assignId(obj: object): string {
  const cachedValue = randomIdCache.get(obj)
  if (cachedValue) return cachedValue

  const id = randomId()
  randomIdCache.set(obj, id)
  return id
}

interface Serializable {
  serialize: (...args: never[]) => unknown
}

const isRecord = (thing: unknown): thing is Record<string, unknown> =>
  !!thing && typeof thing === 'object' && !Array.isArray(thing)

const isSubscribable = (thing: unknown): thing is Subscribable<unknown> | PromiseLike<unknown> => {
  if (!isRecord(thing)) return false
  return typeof thing.subscribe === 'function' || typeof thing.then === 'function'
}

const isSerializable = (thing: unknown): thing is Serializable => {
  if (!isRecord(thing)) return false
  return typeof thing.serialize === 'function'
}

const KNOWN_STRUCTURE_EXPORTS = ['getDefaultDocumentNode']

function isStructure(structure: unknown): structure is UnresolvedPaneNode {
  if (typeof structure === 'function') return true
  if (!isRecord(structure)) return false
  return (
    typeof structure.serialize !== 'function' ||
    typeof structure.then !== 'function' ||
    typeof structure.subscribe !== 'function' ||
    typeof structure.type !== 'string'
  )
}

export const loadStructure = (): UnresolvedPaneNode => {
  const mod = require('part:@sanity/desk-tool/structure?') || defaultStructure
  const structure: UnresolvedPaneNode = mod && mod.__esModule ? mod.default : mod

  warnOnUnknownExports(mod)

  if (!isStructure(structure)) {
    throw new Error(
      `Structure needs to export a function, an observable, a promise or a structure builder, got ${typeof structure}`
    )
  }

  return structure
}

function warnOnUnknownExports(mod: Record<string, unknown>) {
  if (!mod) return

  const known = [...KNOWN_STRUCTURE_EXPORTS, 'default']
  const unknownKeys = Object.keys(mod).filter((key) => !known.includes(key))

  for (const key of unknownKeys) {
    const {closest} = known.reduce<{
      closest: string | null
      distance: number
    }>(
      (acc, current) => {
        const distance = leven(current, key)
        return distance < 3 && distance < acc.distance ? {closest: current, distance} : acc
      },
      {closest: null, distance: +Infinity}
    )

    const hint = closest ? ` - did you mean "${closest}"` : ''

    // eslint-disable-next-line
    console.warn(`Unknown structure export "${key}"${hint}`)
  }
}

export interface PaneResolutionErrorOptions {
  message: string
  context?: RouterPaneSiblingContext
  helpId?: string
  cause?: Error
}

/**
 * An error thrown during pane resolving. This error is meant to be bubbled up
 * through react and handled in an error boundary. It includes a `cause`
 * property which is the original error caught
 */
export class PaneResolutionError extends Error {
  cause: Error | undefined
  context: RouterPaneSiblingContext | undefined
  helpId: string | undefined

  constructor({message, context, helpId, cause}: PaneResolutionErrorOptions) {
    super(message)
    this.context = context
    this.helpId = helpId
    this.cause = cause
  }
}

/**
 * The signature of the function used to take an `UnresolvedPaneNode` and turn
 * it into an `Observable<PaneNode>`.
 *
 * Note: the implementation of this function is memoized
 *
 * @see createResolvedPaneNodeStream look for `wrapFn`
 */
export type PaneResolver = (
  unresolvedPane: UnresolvedPaneNode | undefined,
  context: RouterPaneSiblingContext,
  flatIndex: number
) => Observable<PaneNode>

export type PaneResolverMiddleware = (paneResolveFn: PaneResolver) => PaneResolver

const rethrowWithPaneResolutionErrors: PaneResolverMiddleware = (next) => (
  unresolvedPane,
  context,
  flatIndex
) => {
  try {
    return next(unresolvedPane, context, flatIndex)
  } catch (e) {
    // re-throw errors that are already `PaneResolutionError`s
    if (e instanceof PaneResolutionError) {
      throw e
    }

    // anything, wrap with `PaneResolutionError` and set the underlying
    // error as a the `cause`
    throw new PaneResolutionError({
      message: typeof e?.message === 'string' ? e.message : '',
      context,
      cause: e,
    })
  }
}

export function createPaneResolver(middleware: PaneResolverMiddleware): PaneResolver {
  // note: this API includes a middleware/wrapper function because the function
  // is recursive. we want to call the wrapped version of the function always
  // (even inside of nested calls) so the identifier invoked for the recursion
  // should be the wrapped version
  const resolvePane = rethrowWithPaneResolutionErrors(
    middleware((unresolvedPane, context, flatIndex) => {
      if (!unresolvedPane) {
        throw new PaneResolutionError({
          message: 'Pane returned no child',
          context,
          helpId: 'structure-item-returned-no-child',
        })
      }

      if (isSubscribable(unresolvedPane)) {
        return observableFrom(unresolvedPane).pipe(
          switchMap((result) => resolvePane(result, context, flatIndex))
        )
      }

      if (isSerializable(unresolvedPane)) {
        return resolvePane(unresolvedPane.serialize(context), context, flatIndex)
      }

      if (typeof unresolvedPane === 'function') {
        return resolvePane(unresolvedPane(context.id, context), context, flatIndex)
      }

      return observableOf(unresolvedPane)
    })
  )

  return resolvePane
}
