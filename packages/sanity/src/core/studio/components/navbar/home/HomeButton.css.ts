import {createVar, style} from '@vanilla-extract/css'

export const radiusVar = createVar()
export const focusRingShadowVar = createVar()

export const logoMarkContainer = style({
  selectors: {
    '&&': {
      overflow: 'hidden',
      height: '25px',
      width: '25px',
    },
  },
})

export const styledCard = style({
  borderRadius: radiusVar,
  display: 'flex',
  outline: 'none',
  textDecoration: 'none',
  selectors: {
    '&:focus-visible': {
      boxShadow: focusRingShadowVar,
    },
  },
})
