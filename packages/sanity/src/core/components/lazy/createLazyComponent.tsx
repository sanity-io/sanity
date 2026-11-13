import {type ComponentType, type FunctionComponent, lazy, type ReactNode, Suspense} from 'react'

/**
 * Wraps a component in `React.lazy` together with its own `Suspense` boundary, so the result can
 * be exported and rendered like the original component while its implementation loads on first
 * render. Used for public components whose code should not be part of the static import graph
 * of the `sanity` entry: with auto-updating studios that graph is downloaded up front through the
 * import map, and nothing in it is tree-shaken.
 *
 * @internal
 */
export function createLazyComponent<TProps extends object>(
  load: () => Promise<ComponentType<TProps>>,
  fallback: ReactNode = null,
): FunctionComponent<TProps> {
  const LazyComponent = lazy(() => load().then((Component) => ({default: Component})))

  return function LazyComponentBoundary(props: TProps) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}
