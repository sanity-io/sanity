import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const popover = style({})

/* Make the popover scrollable if it overflows the viewport.
 * Reserve space for the scrollbar so content that grows past the viewport
 * (e.g. when switching tabs) doesn't cause a horizontal layout shift.
 * position:relative makes the wrapper an offsetParent so change-connector
 * geometry subtracts its scrollTop. */
globalStyle(`${popover} [data-ui='Popover__wrapper']`, {
  overflow: 'auto',
  position: 'relative',
  scrollbarGutter: 'stable',
})

/** `${radius[3]}px` */
export const stickyLayerRadiusVar = createVar()

// This layer is sticky so that the header is always visible when scrolling
export const stickyLayer = style({
  top: 0,
  width: '100%',
  background: 'var(--card-bg-color)',
  borderBottom: '1px solid var(--card-border-color)',
  borderTopLeftRadius: stickyLayerRadiusVar,
  borderTopRightRadius: stickyLayerRadiusVar,
  selectors: {
    // Layer sets `position: relative` on itself
    '&&': {
      position: 'sticky',
    },
  },
})
