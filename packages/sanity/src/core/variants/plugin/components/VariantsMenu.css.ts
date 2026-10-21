import {globalStyle, style} from '@vanilla-extract/css'

export const menu = style({
  selectors: {
    '&&': {
      minWidth: '240px',
      maxWidth: '320px',
    },
  },
})

globalStyle(`${menu} > [data-ui='Stack']`, {
  gap: 0,
})

export const sectionHeader = style({
  textTransform: 'uppercase',
  selectors: {
    '&&': {
      letterSpacing: '0.04em',
    },
  },
})
