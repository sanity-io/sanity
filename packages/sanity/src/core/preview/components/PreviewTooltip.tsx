import {PortalProvider} from '@sanity/ui'
import {
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {Popover, type PopoverProps} from '../../../ui-components/popover/Popover'
import {TOOLTIP_DELAY_PROPS} from '../../../ui-components/tooltip/constants'

/**
 * PROPOSED: where a preview row's tooltip opens. `below`, the default: under the status icons, aligned to their right edge, else above them
 * (in forms, search results and dialogs; a side would cover the form or be cut off). `beside`: to the right of the status icons, top aligned,
 * else to their left, below or above (the structure list pane, whose rows have room to their right).
 *
 * @internal
 */
export type PreviewTooltipPlacement = 'below' | 'beside'

const PLACEMENTS: Record<
  PreviewTooltipPlacement,
  {placement: PopoverProps['placement']; fallbackPlacements: PopoverProps['fallbackPlacements']}
> = {
  below: {placement: 'bottom-end', fallbackPlacements: ['top-end']},
  beside: {
    placement: 'right-start',
    fallbackPlacements: ['left-start', 'bottom-start', 'top-start'],
  },
}

/**
 * Hover tooltip for preview rows (e.g. the document status tooltip in
 * reference pickers, document lists and search results).
 *
 * Preview rows live inside scrollable — sometimes virtualized — lists.
 * Scrolling such a list under a stationary pointer fires no mouseleave, so a
 * plain tooltip would stay open, detached from the row it was anchored to
 * (or anchored to a recycled row that now shows another document). Instead,
 * force-close the tooltip on any ancestor scroll while the row is hovered;
 * it can open again once the pointer re-enters a row.
 *
 * @internal
 */
export function PreviewTooltip(props: {
  children: ReactNode
  content: ReactNode
  placement?: PreviewTooltipPlacement
}) {
  const {children, content, placement = 'below'} = props
  const [hovered, setHovered] = useState(false)
  const [suspended, setSuspended] = useState(false)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const rowRef = useRef<HTMLDivElement | null>(null)

  // The `mouseover`/`mouseout` pair is used (rather than mouseenter/mouseleave)
  // because mouseover bubbles from the row's descendants, so entering any part of the row counts.
  const handleMouseOver = useCallback(() => {
    // PROPOSED: the whole row opens it, as shipped, but it is placed beside the part of the row marked as its anchor (the status icons), so it
    // does not cover the row's text. Without a mark, it is placed beside the row.
    const row = rowRef.current
    setAnchor(row?.querySelector<HTMLElement>('[data-preview-tooltip-anchor]') ?? row)
    setHovered(true)
  }, [])

  const handleMouseOut = useCallback(
    (event: MouseEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) => {
      // Moving between descendants of the row also fires mouseout; only reset
      // when the pointer actually leaves the row.
      if (
        event.relatedTarget instanceof Node &&
        event.currentTarget.contains(event.relatedTarget)
      ) {
        return
      }
      setHovered(false)
      setOpen(false)
      setSuspended(false)
    },
    [],
  )

  // Opens after the tooltip delay (it closes at once when the pointer leaves the row).
  useEffect(() => {
    if (!hovered) {
      return undefined
    }
    const timeout = setTimeout(() => setOpen(true), TOOLTIP_DELAY_PROPS.open)
    return () => clearTimeout(timeout)
  }, [hovered])

  useEffect(() => {
    if (!hovered) {
      return undefined
    }
    const handleScroll = () => setSuspended(true)
    // Capture phase, since scroll events don't bubble from nested containers.
    window.addEventListener('scroll', handleScroll, {capture: true, passive: true})
    return () => window.removeEventListener('scroll', handleScroll, {capture: true})
  }, [hovered])

  const shown = open && !suspended && Boolean(anchor)

  return (
    <>
      {/* Focus opens and closes it too, as the tooltip did. */}
      <div
        onBlur={handleMouseOut}
        onFocus={handleMouseOver}
        onMouseOut={handleMouseOut}
        onMouseOver={handleMouseOver}
        ref={rowRef}
      >
        {children}
      </div>
      {/* A popover rather than a tooltip, since a tooltip can only be placed beside the element that opens it. It keeps the tooltip's look.
      It is mounted only while shown: a closed popover stays mounted (hidden), and its content would stay in the page for every row.
      It is portalled to the page itself: a pane or a form provides its own portal, inside its scroll container, which would cut it off. */}
      {shown && typeof document !== 'undefined' ? (
        <PortalProvider element={document.body}>
          <Popover
            content={content}
            fallbackPlacements={PLACEMENTS[placement].fallbackPlacements}
            // The page, not the pane, is its boundary: a pane is narrower than the popover, which would otherwise flip over it.
            floatingBoundary={document.body}
            open
            padding={2}
            placement={PLACEMENTS[placement].placement}
            portal
            radius={2}
            referenceElement={anchor}
            shadow={2}
            style={{pointerEvents: 'none'}}
          />
        </PortalProvider>
      ) : null}
    </>
  )
}
