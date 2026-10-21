import {globalStyle, style} from '@vanilla-extract/css'

export const rootPopover = style({})

globalStyle(`${rootPopover} [data-ui='Popover__wrapper']`, {
  overflow: 'auto',
  maxHeight: '60vh',
})

export const contentScrollerBox = style({
  /* Prevent overflow caused by change indicator */
  overflowX: 'hidden',
})

export const contentHeaderBox = style({
  boxShadow: '0 1px 0 var(--card-shadow-outline-color)',
  position: 'relative',
  zIndex: 10,
  selectors: {
    '&&': {
      minHeight: 'auto',
    },
  },
})
