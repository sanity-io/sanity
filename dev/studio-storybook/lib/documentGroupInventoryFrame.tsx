/**
 * Named-portal harness for the document group inventory family (`ConfirmDeleteDialog`,
 * `DocumentGroupInventoryAction`'s popover, `DocumentGroupInventory`'s own dialogs).
 *
 * Every one of these takes a REQUIRED `portalElementName: string` prop and threads it
 * straight into the Studio `Dialog` / `@sanity/ui` `Popover`'s `portal` prop. `@sanity/ui`'s
 * `Portal` resolves a string `portal` prop through `PortalContext`'s NAMED `elements` map
 * (`portal.elements[name] || portal.elements?.default`), never through the unnamed
 * `element` slot `stories/overlays/OverlayFrame.tsx` sets up. Mount one of these components
 * inside plain `OverlayFrame` (or with no portal host at all) and the portal resolves to
 * nothing, silently: no error, no fallback to `document.body`, just an empty subtree. This
 * frame registers the SAME name the story hands the component as a live DOM node, so the
 * portal actually renders, contained in-frame and inheriting the story's theme scheme,
 * exactly as `OverlayFrame` does for the unnamed case.
 */
import {BoundaryElementProvider, Card, LayerProvider, PortalProvider} from '@sanity/ui'
import {type ReactNode, useState} from 'react'

export function NamedPortalFrame({
  portalElementName,
  minHeight = 320,
  children,
}: {
  /** The exact string passed as the component's own `portalElementName` prop. */
  portalElementName: string
  minHeight?: number
  children: ReactNode
}) {
  const [boundaryEl, setBoundaryEl] = useState<HTMLDivElement | null>(null)
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null)

  return (
    <LayerProvider>
      <BoundaryElementProvider element={boundaryEl}>
        <Card
          ref={setBoundaryEl}
          padding={4}
          radius={3}
          shadow={1}
          style={{position: 'relative', minHeight}}
        >
          <PortalProvider
            __unstable_elements={portalEl ? {[portalElementName]: portalEl} : undefined}
          >
            {children}
            <div data-portal="" ref={setPortalEl} />
          </PortalProvider>
        </Card>
      </BoundaryElementProvider>
    </LayerProvider>
  )
}
