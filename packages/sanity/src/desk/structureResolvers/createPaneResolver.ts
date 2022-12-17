import {from, isObservable, Observable, of as observableOf, Subscribable} from 'rxjs'

import {publishReplay, refCount, switchMap} from 'rxjs/operators'

import {PaneNode, RouterPaneSiblingContext, UnresolvedPaneNode} from '../types'
import {PaneResolutionError} from './PaneResolutionError'
import {isRecord} from 'sanity'

interface Serializable {
  serialize: (...args: never[]) => unknown
}

const isPromise = (thing: any): thing is PromiseLike<unknown> => {
  return !!thing && typeof thing?.then === 'function'
}
const isSerializable = (thing: unknown): thing is Serializable => {
  if (!isRecord(thing)) return false
  return typeof thing.serialize === 'function'
}

/**
 * The signature of the function used to take an `UnresolvedPaneNode` and turn
 * it into an `Observable<PaneNode>`.
 */
export type PaneResolver = (
  unresolvedPane: UnresolvedPaneNode | undefined,
  context: RouterPaneSiblingContext,
  flatIndex: number
) => Observable<PaneNode>

export type PaneResolverMiddleware = (paneResolveFn: PaneResolver) => PaneResolver

const rethrowWithPaneResolutionErrors: PaneResolverMiddleware =
  (next) => (unresolvedPane, context, flatIndex) => {
    try {
      return next(unresolvedPane, context, flatIndex)
    } catch (e) {
      // re-throw errors that are already `PaneResolutionError`s
      if (e instanceof PaneResolutionError) {
        throw e
      }

      // anything else, wrap with `PaneResolutionError` and set the underlying
      // error as a the `cause`
      throw new PaneResolutionError({
        message: typeof e?.message === 'string' ? e.message : '',
        context,
        cause: e,
      })
    }
  }

const wrapWithPublishReplay: PaneResolverMiddleware =
  (next) =>
  (...args) => {
    return next(...args).pipe(
      // need to add publishReplay + refCount to ensure new subscribers always
      // get an emission. without this, memoized observables may get stuck
      // waiting for their first emissions resulting in a loading pane
      publishReplay(1),
      refCount()
    )
  }

export function createPaneResolver(middleware: PaneResolverMiddleware): PaneResolver {
  // note: this API includes a middleware/wrapper function because the function
  // is recursive. we want to call the wrapped version of the function always
  // (even inside of nested calls) so the identifier invoked for the recursion
  // should be the wrapped version
  const resolvePane = rethrowWithPaneResolutionErrors(
    wrapWithPublishReplay(
      middleware((unresolvedPane, context, flatIndex) => {
        if (!unresolvedPane) {
          throw new PaneResolutionError({
            message: 'Pane returned no child',
            context,
            helpId: 'structure-item-returned-no-child',
          })
        }

        if (isPromise(unresolvedPane) || isObservable(unresolvedPane)) {
          return from(unresolvedPane).pipe(
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
  )

  return resolvePane
}
