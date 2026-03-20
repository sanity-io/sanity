import {createVar, style} from '@vanilla-extract/css'

import {RELEASE_TYPES_TONES} from '../../releases'

const asapTone = RELEASE_TYPES_TONES.asap.tone
const scheduledTone = RELEASE_TYPES_TONES.scheduled.tone
const undecidedTone = RELEASE_TYPES_TONES.undecided.tone

export const indexVar = createVar()

export const dot = style({
  width: '5px',
  height: '5px',
  backgroundColor: 'var(--card-icon-color)',
  borderRadius: '999px',
  boxShadow: '0 0 0 1px var(--card-bg-color)',
  zIndex: 1,
  selectors: {
    '&[data-status="published"]': {
      // @ts-expect-error CSS custom property
      '--card-icon-color': 'var(--card-badge-positive-dot-color)',
    },
    '&[data-status="draft"]': {
      // @ts-expect-error CSS custom property
      '--card-icon-color': 'var(--card-badge-caution-dot-color)',
    },
    '&[data-status="asap"]': {
      // @ts-expect-error CSS custom property
      '--card-icon-color': `var(--card-badge-${asapTone}-dot-color)`,
    },
    '&[data-status="undecided"]': {
      // @ts-expect-error CSS custom property
      '--card-icon-color': `var(--card-badge-${undecidedTone}-dot-color)`,
    },
    '&[data-status="scheduled"]': {
      // @ts-expect-error CSS custom property
      '--card-icon-color': `var(--card-badge-${scheduledTone}-dot-color)`,
    },
  },
})
