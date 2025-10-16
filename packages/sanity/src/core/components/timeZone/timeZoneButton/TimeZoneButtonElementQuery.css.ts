import {style} from '@vanilla-extract/css'

export const timeZoneButtonElementQueryStyle = style({
  selectors: {
    '& .button-small': {
      display: 'block',
    },
    '& .button-large': {
      display: 'none',
    },
    '&[data-eq-min~="2"] .button-small': {
      display: 'none',
    },
    '&[data-eq-min~="2"] .button-large': {
      display: 'block',
    },
  },
})
