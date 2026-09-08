import {type MouseEvent, type ReactNode, useCallback, useEffect, useState} from 'react'

import {Tooltip, type TooltipProps} from '../../../ui-components/tooltip/Tooltip'

const TOOLTIP_FALLBACK_PLACEMENTS: TooltipProps['fallbackPlacements'] = ['top-end', 'bottom-end']

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

  // The `mouseover`/`mouseout` pair is used (rather than mouseenter/mouseleave)
  // because the Tooltip clones its child and replaces any mouseenter/mouseleave
  // handlers on it with its own.
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
  }, [])

  useEffect(() => {
    if (!hovered) {
      return undefined
    }
    const handleScroll = () => setSuspended(true)
    // Capture phase, since scroll events don't bubble from nested containers.
    window.addEventListener('scroll', handleScroll, {capture: true, passive: true})
    return () => window.removeEventListener('scroll', handleScroll, {capture: true})
  }, [hovered])

  return (
    <Tooltip
      content={content}
      disabled={suspended}
      fallbackPlacements={TOOLTIP_FALLBACK_PLACEMENTS}
      placement="right"
    >
      {/* Currently tooltips won't trigger without a wrapping element */}
      {/* oxlint-disable-next-line jsx-a11y/mouse-events-have-key-events -- focus/blur handlers here would be dead code: the Tooltip clones this element and installs its own onFocus/onBlur (keyboard support), while the scroll suppression is inherently pointer-driven */}
      <div onMouseOut={handleMouseOut} onMouseOver={handleMouseOver}>
        {children}
      </div>
    </Tooltip>
  )
}
