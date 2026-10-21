import {type ComponentType, type FunctionComponent, type ReactNode, Suspense} from 'react'

/**
 * A module whose default export is the implementation, i.e. what `() => import('./X.lazy')`
 * resolves to. Taking this shape means a call site passes its `import()` through unchanged,
 * instead of remapping the module and re-wrapping the result in `{default}`.
 */
type LazyModule<TProps extends object> = {default: ComponentType<TProps>}

interface LazyComponentOptions {
  /**
   * Rendered while the implementation loads, behind a `Suspense` boundary of this component's
   * own. Omit it to render no boundary at all, so the component suspends to the nearest ancestor
   * one: that is what form nodes want, because a field-sized fallback does not exist and
   * `FormBuilder` (or the Portable Text per-block boundary) already has the right one.
   */
  fallback?: ReactNode
}

/**
 * Wraps a dynamically imported component so the result can be exported and rendered like the
 * original while its implementation loads on first render. Used for public components whose code
 * should not be part of the static import graph of the `sanity` entry: with auto-updating studios
 * that graph is downloaded up front through the import map, and nothing in it is tree-shaken.
 *
 * Unlike `React.lazy` this renders synchronously once the module has loaded. `React.lazy` calls
 * the loader again per lazy component, and `import()` hands back a fresh pending promise even
 * when the module is already in the registry, so the first render of every facade suspends — with
 * a `null` fallback that reads as a field collapsing and then expanding. Holding the resolved
 * component here means only the very first render of a given facade can suspend.
 *
 * @internal
 */
export function createLazyComponent<TProps extends object>(
  load: () => Promise<LazyModule<TProps>>,
  options: LazyComponentOptions = {},
): FunctionComponent<TProps> {
  const cache: {
    Resolved?: ComponentType<TProps>
    error?: unknown
    pending?: Promise<void>
  } = {}

  /**
   * Returns the implementation, throws the in-flight load while it is pending, and throws the
   * load error once it has failed. Throwing a thenable is the low-level Suspense contract, which
   * is what `React.lazy` uses internally; throwing the same promise on every attempt lets React
   * retry the subtree once it settles. A failed load has to throw the *error* on the retry, not
   * the rejected promise again, or React has nothing to hand the error boundary.
   */
  function read(): ComponentType<TProps> {
    if (cache.Resolved) {
      return cache.Resolved
    }
    if ('error' in cache) {
      throw cache.error
    }
    if (!cache.pending) {
      cache.pending = load().then(
        (module) => {
          cache.Resolved = module.default
          return undefined
        },
        (error: unknown) => {
          cache.error = error
          return undefined
        },
      )
    }
    throw cache.pending
  }

  function LazyComponent(props: TProps) {
    const Component = read()

    // oxlint-disable-next-line react/static-components -- `read()` hands back one stable identity: the implementation is cached for the lifetime of this facade, so there is no per-render component whose state could reset. This is the shape `React.lazy` has internally.
    return <Component {...props} />
  }

  if (!('fallback' in options)) {
    return LazyComponent
  }

  return function LazyComponentBoundary(props: TProps) {
    return (
      <Suspense fallback={options.fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}
