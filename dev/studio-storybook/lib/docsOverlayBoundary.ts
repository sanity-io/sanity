import {createContext, useContext} from 'react'

/**
 * The two body-level hosts the autodocs overlay decorator installs, and the private channel a
 * harness uses to defer to them.
 *
 * WHY A PRIVATE CONTEXT RATHER THAN `useBoundaryElement()`.
 *
 * `.storybook/decorators/withDocsOverlayContext.decorator.tsx` supplies a viewport-sized
 * `BoundaryElementProvider` on the docs surface, which repairs popovers that would otherwise be
 * measured against their canvas's hugged closed height. But React context resolves to the NEAREST
 * provider, and `lib/formBuilderHarness.tsx` installs its own `BoundaryElementProvider` pointing at
 * the form `Scroller`. On the docs surface that scroller is 78px to 318px tall, so it shadows the
 * decorator and reinstates the exact defect. Read off the live fiber tree on
 * `forms-input-imageinput--docs`: the popover's boundary chain is `640x318` then `1300x950 [MINE]`,
 * both the same context object, inner winning.
 *
 * The harness therefore has to opt in. It cannot do that by reading `useBoundaryElement()` and
 * preferring whatever it finds, because five story files put `FormBuilderHarness` and
 * `OverlayFrame` in the same module, and an `OverlayFrame` ancestor would satisfy that read in
 * STORY mode too, changing rendering that must not change.
 *
 * A context only this decorator ever provides has no such ambiguity:
 *
 * - In story mode the decorator returns the story untouched and never renders the provider, so
 *   this context holds its `null` default and `docsBoundary ?? documentScrollElement` reduces to
 *   `documentScrollElement`, the identical element with the identical props. Nothing else in the
 *   catalog can provide this context, so nothing else can satisfy the read by accident.
 * - In docs mode the decorator provides the viewport host and the harness defers to it.
 *
 * Deliberate containment is unaffected: `OverlayFrame` and `NamedPortalFrame` keep their own
 * `BoundaryElementProvider` and keep winning, because they do not consult this context at all.
 */

let boundaryHost: HTMLDivElement | null = null
let portalHost: HTMLDivElement | null = null

/**
 * Creates (once) the two body-level hosts. Both live outside every story subtree, so a docs canvas
 * whose overlays are closed renders byte-identically. Measured on a real docs page: the boundary's
 * rect is exactly `visualViewport` at scrollY 0 and at 3000, and `body.scrollHeight` is unchanged
 * with it attached.
 */
export function ensureDocsOverlayHosts(): {
  boundary: HTMLDivElement | null
  portal: HTMLDivElement | null
} {
  if (typeof document === 'undefined') return {boundary: null, portal: null}

  if (!boundaryHost?.isConnected) {
    boundaryHost = document.createElement('div')
    boundaryHost.setAttribute('data-docs-overlay-boundary', '')
    boundaryHost.setAttribute('aria-hidden', 'true')
    boundaryHost.style.position = 'fixed'
    boundaryHost.style.inset = '0'
    boundaryHost.style.pointerEvents = 'none'
    document.body.appendChild(boundaryHost)
  }

  if (!portalHost?.isConnected) {
    portalHost = document.createElement('div')
    portalHost.setAttribute('data-portal', '')
    document.body.appendChild(portalHost)
  }

  return {boundary: boundaryHost, portal: portalHost}
}

/** Null everywhere except inside a story rendered on the autodocs surface. */
export const DocsOverlayBoundaryContext = createContext<HTMLElement | null>(null)

/**
 * The docs-surface boundary, or null. A harness that installs its own `BoundaryElementProvider`
 * should prefer this when it is set:
 *
 * ```tsx
 * <BoundaryElementProvider element={useDocsOverlayBoundary() ?? myScrollElement}>
 * ```
 */
export function useDocsOverlayBoundary(): HTMLElement | null {
  return useContext(DocsOverlayBoundaryContext)
}
