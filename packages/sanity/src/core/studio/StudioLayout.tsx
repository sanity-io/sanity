import {Suspense} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {useLayoutComponent} from './studio-components-hooks/useLayoutComponent'
import {useProviderComponent} from './studio-components-hooks/useProviderComponent'

/** @internal */
export interface NavbarContextValue {
  onSearchFullscreenOpenChange: (open: boolean) => void
  onSearchOpenChange: (open: boolean) => void
  searchFullscreenOpen: boolean
  searchFullscreenPortalEl: HTMLElement | null
  searchOpen: boolean
}

/**
 * The Studio Layout component is the root component of the Sanity Studio UI.
 * It renders the navbar, the active tool, and the search modal as well as the error boundary.
 *
 * @public
 * @returns A Studio Layout element that renders the navbar, the active tool, and the search modal as well as the error boundary
 * @remarks This component should be used as a child component to the StudioProvider
 * @example Rendering a Studio Layout
 * ```ts
 * <StudioProvider
 *  basePath={basePath}
 *  config={config}
 *  onSchemeChange={onSchemeChange}
 *  scheme={scheme}
 *  unstable_history={unstable_history}
 *  unstable_noAuthBoundary={unstable_noAuthBoundary}
 * >
 *   <StudioLayout />
 *</StudioProvider>
 * ```
 */
export function StudioLayout() {
  // Use the layout component that is resolved by the Components API (`studio.components.layout`).
  // The default component is `StudioLayoutComponent`.
  const Layout = useLayoutComponent()
  // Plugin providers (`studio.components.provider`) wrap the boundary rather than sit inside it,
  // so a promise they start can be `use()`d by the layout, navbar or a tool, which then suspends
  // up to this loading screen instead of needing a boundary of its own. Rendering them outside
  // the boundary also means the requests they start go out alongside the lazy layout chunks.
  const Provider = useProviderComponent()

  // Same loading screen `WorkspaceLoader` shows right before this mounts, so a lazy layout
  // continues it instead of flashing a different placeholder.
  return (
    // oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work
    <Provider>
      <Suspense fallback={<LoadingBlock />}>
        {/* oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work */}
        <Layout />
      </Suspense>
    </Provider>
  )
}
