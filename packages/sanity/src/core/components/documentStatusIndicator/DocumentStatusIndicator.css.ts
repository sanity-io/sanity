import {css} from '#styled-system/css'

import {RELEASE_TYPES_TONES} from '../../releases/util/const'

/** `${$index}` — stacking order of the dot within the indicator row */
export const dotZIndexVar = '--document-status-indicator-dot-z-index'

export const dot = css({
  'width': '5px',
  'height': '5px',
  'backgroundColor': 'var(--card-icon-color)',
  'borderRadius': '999px',
  'boxShadow': '0 0 0 1px var(--card-bg-color)',
  'zIndex': `var(${dotZIndexVar})`,
  "&[data-status='published']": {
    '--card-icon-color': 'var(--card-badge-positive-dot-color)',
  },
  "&[data-status='draft']": {
    '--card-icon-color': 'var(--card-badge-caution-dot-color)',
  },
  "&[data-status='asap']": {
    '--card-icon-color': `var(--card-badge-${RELEASE_TYPES_TONES.asap.tone}-dot-color)`,
  },
  "&[data-status='undecided']": {
    '--card-icon-color': `var(--card-badge-${RELEASE_TYPES_TONES.undecided.tone}-dot-color)`,
  },
  "&[data-status='scheduled']": {
    '--card-icon-color': `var(--card-badge-${RELEASE_TYPES_TONES.scheduled.tone}-dot-color)`,
  },
})
