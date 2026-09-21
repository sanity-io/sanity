import {createVar, style} from '@vanilla-extract/css'

import {RELEASE_TYPES_TONES} from '../../releases/util/const'

/** `${$index}` — stacking order of the dot within the indicator row */
export const dotZIndexVar = createVar()

export const dot = style({
  width: '5px',
  height: '5px',
  backgroundColor: 'var(--card-icon-color)',
  borderRadius: '999px',
  boxShadow: '0 0 0 1px var(--card-bg-color)',
  zIndex: dotZIndexVar,
  selectors: {
    "&[data-status='published']": {
      vars: {'--card-icon-color': 'var(--card-badge-positive-dot-color)'},
    },
    "&[data-status='draft']": {
      vars: {'--card-icon-color': 'var(--card-badge-caution-dot-color)'},
    },
    "&[data-status='asap']": {
      vars: {'--card-icon-color': `var(--card-badge-${RELEASE_TYPES_TONES.asap.tone}-dot-color)`},
    },
    "&[data-status='undecided']": {
      vars: {
        '--card-icon-color': `var(--card-badge-${RELEASE_TYPES_TONES.undecided.tone}-dot-color)`,
      },
    },
    "&[data-status='scheduled']": {
      vars: {
        '--card-icon-color': `var(--card-badge-${RELEASE_TYPES_TONES.scheduled.tone}-dot-color)`,
      },
    },
  },
})
