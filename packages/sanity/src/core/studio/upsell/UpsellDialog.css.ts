import {white} from '@sanity/color'
import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `space[3]`, set on the close button by `UpsellDialog`. */
export const space3Var = createVar()

/** Absolute positioned button to close the dialog. */
export const closeButton = style({
  boxShadow: 'none',
  selectors: {
    '&&': {
      position: 'absolute',
      top: space3Var,
      right: space3Var,
      zIndex: 20,
      background: 'transparent',
      borderRadius: '9999px',
      color: white.hex,
      vars: {'--card-fg-color': white.hex},
    },
  },
})

/** The original nested `:hover` compiled to a descendant selector, so keep it that way. */
globalStyle(`${closeButton} :hover`, {
  vars: {'--card-fg-color': white.hex},
})

export const image = style({
  objectFit: 'cover',
  width: '100%',
  height: ['100%', '200px'],
})
