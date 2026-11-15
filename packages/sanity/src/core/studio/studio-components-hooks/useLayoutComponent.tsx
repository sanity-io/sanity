import {type ComponentType} from 'react'

import {createLazyComponent} from '../../components/lazy/createLazyComponent'
import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {pickLayoutComponent} from './picks'

// The default layout is only rendered once the user is authenticated and the workspace has
// loaded, so its implementation stays out of the import graph the login screen has to download.
// `preloadStudioShell` fetches it as soon as authentication succeeds.
//
// No boundary of its own: `StudioLayout` already wraps the layout in `Suspense` with the same
// `LoadingBlock` fallback. A second boundary here would commit a customer's
// `studio.components.layout` wrapper around a spinner first and the default layout in a later
// commit, so an effect in that wrapper measuring or focusing the navbar or tool DOM would run
// against the fallback. It would also be the pattern `warnIfSuspendsOnCriticalPath` tells plugin
// authors to avoid.
const DefaultLayoutComponent = createLazyComponent(() => import('../StudioLayoutComponent.lazy'))

/**
 * @internal
 */
export function useLayoutComponent(): ComponentType {
  return useMiddlewareComponents({
    defaultComponent: DefaultLayoutComponent,
    pick: pickLayoutComponent,
  })
}
