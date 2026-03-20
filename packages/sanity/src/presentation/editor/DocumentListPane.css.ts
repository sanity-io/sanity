import {globalStyle, style} from '@vanilla-extract/css'

export const rootLayout = style({
  selectors: {
    '&&': {
      height: '100%',
    },
  },
})

export const root = style({})

globalStyle(`${root} > div`, {
  minWidth: 'unset !important' as any,
  maxWidth: 'unset !important' as any,
})

export const wrappedCode = style({
  selectors: {
    '&&': {
      whiteSpace: 'pre-wrap',
    },
  },
})
