import {PortalProvider} from '@sanity/ui'
import {type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState} from 'react'

import {Popover, type PopoverProps} from '../../../ui-components/popover/Popover'
import {TOOLTIP_DELAY_PROPS} from '../../../ui-components/tooltip/constants'
import {anchor as anchorClassName, popover} from './PreviewTooltip.css'

/**
 * Where a preview row's tooltip opens: `below` its anchor (or above it when there is no room), or
 * `beside` it, for rows that have room to their right.
 *
 * @internal
 */
export type PreviewTooltipPlacement = 'below' | 'beside'

const PLACEMENTS: Record<
  PreviewTooltipPlacement,
  Pick<PopoverProps, 'placement' | 'fallbackPlacements'>
> = {
  below: {placement: 'bottom-end', fallbackPlacements: ['top-end']},
  beside: {
    placement: 'right-start',
    fallbackPlacements: ['left-start', 'bottom-start', 'top-start'],
  },
}

const ANCHOR_SELECTOR = '[data-preview-tooltip-anchor]'

/**
 * Marks the part of a preview row its tooltip is placed against, instead of the whole row.
 *
 * @internal
 */
export function PreviewTooltipAnchor({children}: {children: ReactNode}) {
  return (
    <span className={anchorClassName} data-preview-tooltip-anchor="">
      {children}
    </span>
  )
}

/**
 * Hover tooltip for preview rows (e.g. the document status tooltip in
 * reference pickers, document lists and search results). Hovering any part of
 * the row opens it, placed against the row's `PreviewTooltipAnchor` if it has
 * one. It is read only: the pointer cannot interact with it.
 *
 * Preview rows live inside scrollable — sometimes virtualized — lists.
 * Scrolling such a list under a stationary pointer fires no mouseleave, so a
 * plain tooltip would stay open, detached from the row it was anchored to
 * (or anchored to a recycled row that now shows another document). Instead,
 * force-close the tooltip on any ancestor scroll while the row is hovered;
 * it can open again once the pointer re-enters a row.
 *
 * It is portalled to the page, since a pane's own portal sits inside its scroll
 * container and would clip it, and it is only mounted while open, since a
 * closed popover stays mounted and would keep its content in the page for
 * every row.
 *
 * @internal
 */
export function PreviewTooltip(props: {
  children: ReactNode
  content: ReactNode
  placement?: PreviewTooltipPlacement
}) {
  const {children, content, placement = 'below'} = props
  const rowRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [suspended, setSuspended] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const handleMouseOver = useCallback(() => {
    setHovered(true)
  }, [])

  const handleMouseOut = useCallback((event: MouseEvent<HTMLDivElement>) => {
    // Moving between descendants of the row also fires mouseout; only reset
    // when the pointer actually leaves the row.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return
    }
    setHovered(false)
    setSuspended(false)
    setAnchor(null)
  }, [])

  useEffect(() => {
    if (!hovered) {
      return undefined
    }
    const openTimeout = setTimeout(() => {
      const row = rowRef.current
      setAnchor(row?.querySelector<HTMLElement>(ANCHOR_SELECTOR) ?? row)
    }, TOOLTIP_DELAY_PROPS.open)
    const handleScroll = () => setSuspended(true)
    // Capture phase, since scroll events don't bubble from nested containers.
    window.addEventListener('scroll', handleScroll, {capture: true, passive: true})
    return () => {
      clearTimeout(openTimeout)
      window.removeEventListener('scroll', handleScroll, {capture: true})
    }
  }, [hovered])

  return (
    <>
      {/* oxlint-disable-next-line jsx-a11y/mouse-events-have-key-events -- keyboard focus lands on the row's link or card, an ancestor of this element, so focus handlers here would never run */}
      <div onMouseOut={handleMouseOut} onMouseOver={handleMouseOver} ref={rowRef}>
        {children}
      </div>
      {anchor && !suspended && (
        <PortalProvider element={document.body}>
          <Popover
            className={popover}
            content={content}
            floatingBoundary={document.body}
            open
            portal
            radius={2}
            referenceElement={anchor}
            shadow={2}
            {...PLACEMENTS[placement]}
          />
        </PortalProvider>
      )}
    </>
  )
}
