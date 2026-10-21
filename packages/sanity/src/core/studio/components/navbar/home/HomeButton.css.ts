import {createVar, style} from '@vanilla-extract/css'

const LOGO_MARK_SIZE = 25 // width and height, px

/** `rem(theme.radius[RADIUS])`, set by the component */
export const radiusVar = createVar()
/** `focusRingStyle(...)` computed from the theme, set by the component */
export const focusRingBoxShadowVar = createVar()

export const logoMarkContainer = style({
  height: `${LOGO_MARK_SIZE}px`,
  width: `${LOGO_MARK_SIZE}px`,
})

export const homeButtonCard = style({
  display: 'flex',
  outline: 'none',
  textDecoration: 'none',
  selectors: {
    '&&': {
      borderRadius: radiusVar,
    },
    '&&:focus-visible': {
      boxShadow: focusRingBoxShadowVar,
    },
  },
})
