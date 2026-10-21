import {style} from '@vanilla-extract/css'

export const container = style({
  position: 'relative',
  selectors: {
    '&&': {
      paddingBottom: '100%',
    },
  },
})

export const image = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'contain',
})
