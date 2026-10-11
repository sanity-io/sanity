import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export interface PortalBoundaryContextValue {
  /** The visible region for content rendered through `portalElement`, or `null` while unmounted. */
  element: HTMLElement | null
  /** The portal target the boundary belongs to — the surface's `PortalProvider` element. */
  portalElement: HTMLElement | null
}

/**
 * The Floating UI boundary for popovers that are allowed to overflow their immediate scroll box
 * and are rendered through the current portal — the visible region of the surface that hosts the
 * portal (typically the document pane's scroll container, which sits between the sticky pane
 * header and footer).
 *
 * Declared by the surface that owns a portal target (see `PortalBoundaryProvider`), never
 * inferred from where the reference element happens to sit in the DOM. Dialogs shadow the
 * ambient `BoundaryElementProvider` with their own scroll container (#12721) but must not shadow
 * this, so popovers that escape the dialog (array insert menu, reference autocomplete results)
 * still respect the hosting pane's chrome.
 *
 * The boundary only applies to consumers that still render into `portalElement`; content that
 * provides its own `PortalProvider` (a body-level dialog, for instance) leaves the surface and
 * the boundary with it. `null` means no host has declared a boundary.
 *
 * @internal
 */
export const PortalBoundaryContext = createContext<PortalBoundaryContextValue | null>(
  'sanity/_singletons/context/portal-boundary',
  null,
)
