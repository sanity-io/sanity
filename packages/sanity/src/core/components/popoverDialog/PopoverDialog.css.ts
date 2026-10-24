import {css} from '#styled-system/css'

export const popover = css({
  /* Make the popover scrollable if it overflows the viewport.
   * Reserve space for the scrollbar so content that grows past the viewport
   * (e.g. when switching tabs) doesn't cause a horizontal layout shift.
   * position:relative makes the wrapper an offsetParent so change-connector
   * geometry subtracts its scrollTop. */
  "& [data-ui='Popover__wrapper']": {
    overflow: 'auto',
    position: 'relative',
    scrollbarGutter: 'stable',
  },
})

/** `${radius[3]}px` */
export const stickyLayerRadiusVar = '--popover-dialog-sticky-layer-radius'

// This layer is sticky so that the header is always visible when scrolling
export const stickyLayer = css({
  'top': 0,
  'width': '100%',
  'background': 'var(--card-bg-color)',
  'borderBottom': '1px solid var(--card-border-color)',
  'borderTopLeftRadius': `var(${stickyLayerRadiusVar})`,
  'borderTopRightRadius': `var(${stickyLayerRadiusVar})`,
  // Layer sets `position: relative` on itself
  '&&': {
    position: 'sticky',
  },
})
