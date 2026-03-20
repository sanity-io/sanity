import {globalStyle, style} from '@vanilla-extract/css'

export const releasesNavContainer = style({
  selectors: {
    '&&': {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '2px',
      margin: '-3px 0',
    },
    '&&:not([hidden])': {
      display: 'flex',
    },
  },
})

/* The children in button is rendered inside a span, we need to absolutely position the dot for the error. */
globalStyle(`${releasesNavContainer} span:has(> [data-ui='error-status-icon'])`, {
  position: 'absolute',
  top: '6px',
  right: '6px',
  padding: '0',
})

globalStyle(`${releasesNavContainer} a:hover, ${releasesNavContainer} button:hover`, {
  position: 'relative',
  zIndex: 2,
})
