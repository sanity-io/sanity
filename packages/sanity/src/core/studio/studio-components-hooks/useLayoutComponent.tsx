import {type ComponentType, lazy, Suspense} from 'react'

import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {pickLayoutComponent} from './picks'

// The default layout is only rendered once the user is authenticated and the workspace has
// loaded, so its implementation stays out of the import graph the login screen has to download.
// `preloadStudioShell` fetches it as soon as authentication succeeds.
const LazyStudioLayoutComponent = lazy(() =>
  import('../StudioLayoutComponent').then((module) => ({default: module.StudioLayoutComponent})),
)

function DefaultLayoutComponent() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <LazyStudioLayoutComponent />
    </Suspense>
  )
}

/**
 * @internal
 */
export function useLayoutComponent(): ComponentType {
  return useMiddlewareComponents({
    defaultComponent: DefaultLayoutComponent,
    pick: pickLayoutComponent,
  })
}
