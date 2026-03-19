import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const radiusVar = createVar()

export const styledPopover = style({})

globalStyle(`${styledPopover} [data-ui='Popover__wrapper']`, {
  overflow: 'auto',
})

// This layer is sticky so that the header is always visible when scrolling
export const stickyLayer = style({
  selectors: {
    '&&': {
      position: 'sticky',
      top: 0,
      width: '100%',
      background: 'var(--card-bg-color)',
      borderBottom: '1px solid var(--card-border-color)',
      borderTopLeftRadius: radiusVar,
      borderTopRightRadius: radiusVar,
    },
  },
})
