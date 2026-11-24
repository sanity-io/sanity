import {from, isObservable, type Observable, of as observableOf, throwError} from 'rxjs'
import {catchError, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {isImportError, isRecord} from 'sanity'

import {type PaneNode, type RouterPaneSiblingContext, type UnresolvedPaneNode} from '../types'
import {PaneResolutionError} from './PaneResolutionError'

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
  flatIndex: number,
) => Observable<PaneNode>

export type PaneResolverMiddleware = (paneResolveFn: PaneResolver) => PaneResolver

function toPaneResolutionError(error: unknown, context: RouterPaneSiblingContext) {
  if (error instanceof PaneResolutionError) return error

  return new PaneResolutionError({
    message: error instanceof Error ? error.message : String(error),
    context,
    cause: error instanceof Error ? error : undefined,
  })
}

const rethrowWithPaneResolutionErrors: PaneResolverMiddleware =
  (next) => (unresolvedPane, context, flatIndex) => {
    try {
      return next(unresolvedPane, context, flatIndex)
    } catch (e) {
      throw toPaneResolutionError(e, context)
    }
  }

// only the structure tool stream wraps async errors; intent resolution needs raw request errors
export function withAsyncPaneResolutionErrors(resolvePane: PaneResolver): PaneResolver {
  return (unresolvedPane, context, flatIndex) =>
    resolvePane(unresolvedPane, context, flatIndex).pipe(
      catchError((error) =>
        throwError(() =>
          error instanceof Error && isImportError(error)
            ? error
            : toPaneResolutionError(error, context),
        ),
      ),
    )
}

const wrapWithPublishReplay: PaneResolverMiddleware =
  (next) =>
  (...args) => {
    return next(...args).pipe(
      // need to add publishReplay + refCount to ensure new subscribers always
      // get an emission. without this, memoized observables may get stuck
      // waiting for their first emissions resulting in a loading pane
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      publishReplay(1),
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      refCount(),
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
            switchMap((result) => resolvePane(result, context, flatIndex)),
          )
        }

        if (isSerializable(unresolvedPane)) {
          return resolvePane(unresolvedPane.serialize(context), context, flatIndex)
        }

        if (typeof unresolvedPane === 'function') {
          return resolvePane(unresolvedPane(context.id, context), context, flatIndex)
        }

        return observableOf(unresolvedPane)
      }),
    ),
  )

  return resolvePane
}
