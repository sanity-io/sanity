import {style} from '@vanilla-extract/css'

export const styledMenu = style({
  selectors: {
    '&&': {
      maxWidth: '260px',
    },
  },
})

export const footerStack = style({
  selectors: {
    '&&': {
      position: 'sticky',
      bottom: 0,
      backgroundColor: 'var(--card-bg-color)',
    },
  },
})
