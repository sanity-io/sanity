import {globalStyle, style} from '@vanilla-extract/css'

export const releasesNavContainer = style({
  position: 'relative',
  display: 'flex',
  selectors: {
    // Card's own `&:not([hidden]) {display: block}` is (0,2,0); the runtime-injected wrapper's
    // equally specific rule used to win by insertion order, so the class is doubled to (0,3,0).
    '&&:not([hidden])': {
      display: 'flex',
    },
  },
  alignItems: 'center',
  gap: '2px',
  padding: '2px',
  margin: '-3px 0',
})

/* The children in button is rendered inside a span, we need to absolutely position the dot for the error. */
globalStyle(`${releasesNavContainer} span:has(> [data-ui='error-status-icon'])`, {
  position: 'absolute',
  top: '6px',
  right: '6px',
  padding: 0,
})

globalStyle(`${releasesNavContainer} a:hover, ${releasesNavContainer} button:hover`, {
  position: 'relative',
  zIndex: 2,
})
