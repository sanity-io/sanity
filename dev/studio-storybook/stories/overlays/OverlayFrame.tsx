import {BoundaryElementProvider, Card, LayerProvider, PortalProvider} from '@sanity/ui'
import {type ReactNode, useState} from 'react'

/**
 * Self-contained harness for the Overlays & Navigation stories.
 *
 * Dialog, Popover, ConfirmPopover and Tooltip all render into a portal. Left to
 * the @sanity/ui defaults those portals attach to `document.body`, which lives
 * OUTSIDE the theme decorator's <ThemeProvider> subtree — so in dark mode a
 * portaled layer paints with light-scheme tokens (the exact portal-theme gotcha
 * called out in the organization brief, section 5).
 *
 * OverlayFrame closes that gap locally, without touching `.storybook/preview.tsx`:
 * it hosts a <PortalProvider> whose element sits INSIDE a themed <Card>, so every
 * portaled layer inherits the story's scheme and stays contained in-frame. The
 * <BoundaryElementProvider> gives popovers/tooltips a boundary to flip against so
 * they never escape the visible canvas, and <LayerProvider> keeps stacking +
 * top-layer Escape handling correct.
 */
export function OverlayFrame({
  children,
  minHeight = 320,
}: {
  children: ReactNode
  minHeight?: number
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
          <PortalProvider element={portalEl}>
            {children}
            <div data-portal="" ref={setPortalEl} />
          </PortalProvider>
        </Card>
      </BoundaryElementProvider>
    </LayerProvider>
  )
}
