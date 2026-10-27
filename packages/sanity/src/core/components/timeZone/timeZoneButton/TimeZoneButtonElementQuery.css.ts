import {css} from '#styled-system/css'

// `.button-small` / `.button-large` are ui5 Boxes, whose own
// `.sui-display-block:not([hidden]) {display: block}` (0,2,0) lives in a static stylesheet with no
// guaranteed order relative to this one. The runtime-injected rule used to win that tie by
// insertion order; doubling the root class wins it by specificity instead.
export const timeZoneButtonElementQuery = css({
  '&& .button-small': {
    display: 'block',
  },
  '&& .button-large': {
    display: 'none',
  },
  "&&[data-eq-min~='2'] .button-small": {
    display: 'none',
  },
  "&&[data-eq-min~='2'] .button-large": {
    display: 'block',
  },
})
