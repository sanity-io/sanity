import {useLayoutComponent} from './studio-components-hooks/useLayoutComponent'

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

  // oxlint-disable-next-line react/react-compiler -- this is intentional and how the middleware components has to work
  return <Layout />
}
