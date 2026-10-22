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

// PROPOSED (the v1 versions popover): it opens to the right of the status icons, top aligned, and falls back to the left, below or above.
const TOOLTIP_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = [
  'left-start',
  'bottom-start',
  'top-start',
]

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
export function PreviewTooltip(props: {children: ReactNode; content: ReactNode}) {
  const {children, content} = props
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
      It is mounted only while shown: a closed popover stays mounted (hidden), and its content would stay in the page for every row. */}
      {shown ? (
        <Popover
          content={content}
          fallbackPlacements={TOOLTIP_FALLBACK_PLACEMENTS}
          // The page, not the pane, is its boundary: a list pane is narrower than the popover, which would otherwise flip over the list.
          floatingBoundary={typeof document === 'undefined' ? null : document.body}
          open
          padding={2}
          placement="right-start"
          portal
          radius={2}
          referenceElement={anchor}
          shadow={2}
          style={{pointerEvents: 'none'}}
        />
      ) : null}
    </>
  )
}
