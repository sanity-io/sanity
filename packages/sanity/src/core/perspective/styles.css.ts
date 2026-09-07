import {style} from '@vanilla-extract/css'

/**
 * A CSS helper that extends the clickable area of a component by adding a pseudo-element.
 * This creates a larger hit area for better usability without affecting the visual size.
 */
export const oversizedButtonStyle = style({
  position: 'relative',
  selectors: {
    // Button sets `cursor` on its own class; the doubled class wins that tie by specificity
    // the way the runtime-injected wrapper used to by insertion order.
    '&&': {
      cursor: 'default',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      display: 'block',
      inset: '-4px',
      borderRadius: '9999px',
    },
  },
})
