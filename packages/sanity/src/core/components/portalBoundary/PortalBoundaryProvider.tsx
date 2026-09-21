import {type ReactNode, useMemo} from 'react'
import {PortalBoundaryContext, type PortalBoundaryContextValue} from 'sanity/_singletons'

/**
 * Declares the Floating UI boundary for popovers rendered through the portal that the wrapped
 * surface provides. Render it alongside the surface's `PortalProvider`, passing the same
 * `portalElement` and the element whose rect is the visible region for portaled content — for the
 * document pane that is its scroll container, so popovers stay between the sticky pane header and
 * footer.
 *
 * Popovers that are allowed to escape a dialog read this through {@link usePortalBoundary}
 * instead of the ambient `BoundaryElementProvider`, which dialogs shadow with their own scroll
 * container. The boundary is tied to `portalElement`: content that renders into another portal
 * (a custom input's own body-level `PortalProvider`) is not constrained by it.
 *
 * @internal
 */
export function PortalBoundaryProvider(props: {
  children: ReactNode
  element: HTMLElement | null
  portalElement: HTMLElement | null
}): React.JSX.Element {
  const {children, element, portalElement} = props
  const value = useMemo<PortalBoundaryContextValue>(
    () => ({element, portalElement}),
    [element, portalElement],
  )
  return <PortalBoundaryContext.Provider value={value}>{children}</PortalBoundaryContext.Provider>
}
