import {BoundaryElementProvider, PortalProvider} from '@sanity/ui'
import {type Decorator} from '@storybook/react-vite'
import {type ReactNode, useMemo, useState} from 'react'

import {DocsOverlayBoundaryContext, ensureDocsOverlayHosts} from '../../lib/docsOverlayBoundary'

/**
 * Ambient overlay context for the AUTODOCS surface only.
 *
 * The autodocs page stacks every story into its own `.docs-story` frame, and that frame is
 * `overflow: auto` inside an `overflow: hidden` `.sbdocs-preview`. Both hug their story's closed
 * content, so a canvas is routinely 75px to 500px tall. `@sanity/ui`'s `Popover` resolves its
 * geometry against `detectOverflow(..., {boundary: floatingBoundary || undefined})`, and when no
 * `BoundaryElementProvider` is in the tree that `undefined` means floating-ui's default,
 * `clippingAncestors`. On the docs surface the nearest clipping ancestors are exactly those two
 * hugged frames, so the popover is measured against the closed height of the thing it is trying
 * to open.
 *
 * Two consumers read that rect, which is why one cause produced two symptoms in the catalog
 * sweep:
 *
 * - `floating-ui/size.ts` writes `style.maxHeight = availableHeight` with no floor, so a menu
 *   with 240px of items renders 20px tall.
 * - `hide({strategy: 'referenceHidden'})` reads the same boundary and, when the trigger is fully
 *   clipped by it, sets `hidden` on the popover card, which is `display: none` and a 0x0 rect.
 *
 * Handing the popover an explicit boundary REPLACES the ancestor walk, so this decorator supplies
 * a viewport-sized one. Measured before and after on `forms-input-video--docs`, same instrument,
 * same trigger: `HIDDEN maxHeight 20px 0x0` became `shown maxHeight 730px 190x204`.
 *
 * `lib/searchHarness.tsx` reached the same design independently for search's nested popovers, and
 * its comment records the same failure mode: "a nested popover constrained to a zero-height box
 * renders `display: none`".
 *
 * WHAT THIS CANNOT FIX. `hide()` is given floating-ui's default `rootBoundary: 'viewport'`, and
 * `getClippingRect` always intersects the root boundary in, so a trigger scrolled off screen is
 * `referenceHidden` no matter what element you supply. On a docs page several thousand pixels
 * tall most triggers are off screen at any moment. That residue is a property of measuring a long
 * page, not of the boundary, and no decorator can remove it.
 *
 * The portal half is a separate, smaller repair. `Portal` resolves a string `portal` prop through
 * `portal.elements[name] || portal.elements?.default`, never through the unnamed `element` slot,
 * so a component threading `portalElementName` into a tree with no named map renders an empty
 * subtree with no error (`lib/documentGroupInventoryFrame.tsx` documents the same trap). Because
 * `default` is the fallback for EVERY name, one entry covers every such component. The unnamed
 * path still reads `element`, which is set to a body-level `[data-portal]` div exactly like the
 * `@sanity/ui` default context creates, so unnamed portals land where they already land.
 *
 * Scope and composition:
 *
 * - Docs only. Story mode returns `<Story />` untouched.
 * - Context, not chrome. Neither provider emits DOM inside the story, and both hosts are appended
 *   to `document.body`, so a docs canvas whose overlays are closed is byte-identical.
 * - Inner wins, by design. `OverlayFrame` and `NamedPortalFrame` install their own providers and
 *   keep containing their overlays in frame. `FormBuilderHarness` installs one too, which shadowed
 *   this decorator until it was taught to defer via `lib/docsOverlayBoundary.ts`.
 * - Opens nothing. Stories that skip their play function in docs view (the `FilterShell` and
 *   `SearchDialog` pattern) are unaffected: this supplies context values and never touches `open`,
 *   focus or events.
 * - Opt out per story with `parameters: {docsOverlay: false}`.
 */
function DocsOverlayContext({children}: {children: ReactNode}) {
  // Lazy initialiser rather than an effect: an effect would give the first paint a null boundary,
  // and the popovers this exists to repair are the ones that mount already open.
  const [hosts] = useState(ensureDocsOverlayHosts)
  const elements = useMemo(
    () => (hosts.portal ? {default: hosts.portal} : undefined),
    [hosts.portal],
  )

  return (
    <DocsOverlayBoundaryContext.Provider value={hosts.boundary}>
      <BoundaryElementProvider element={hosts.boundary}>
        <PortalProvider element={hosts.portal} __unstable_elements={elements}>
          {children}
        </PortalProvider>
      </BoundaryElementProvider>
    </DocsOverlayBoundaryContext.Provider>
  )
}

export const withDocsOverlayContext: Decorator = (Story, context) => {
  if (context.viewMode !== 'docs' || context.parameters?.docsOverlay === false) {
    return <Story />
  }

  return (
    <DocsOverlayContext>
      <Story />
    </DocsOverlayContext>
  )
}
