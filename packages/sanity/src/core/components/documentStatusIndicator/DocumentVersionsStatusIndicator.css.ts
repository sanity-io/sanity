import {globalStyle, style} from '@vanilla-extract/css'

export const iconSlotRoot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '15px',
  flexShrink: 0,
  selectors: {
    "&[data-status='published']": {
      vars: {'--card-icon-color': 'var(--card-badge-positive-dot-color)'},
    },
    "&[data-status='draft']": {
      vars: {'--card-icon-color': 'var(--card-badge-caution-dot-color)'},
    },
    "&[data-status='variant']": {
      vars: {'--card-icon-color': 'var(--card-badge-suggest-dot-color)'},
    },
  },
})

globalStyle(`${iconSlotRoot}[data-status='published'] svg`, {
  vars: {'--icon-color': 'var(--card-badge-positive-dot-color)'},
})

globalStyle(`${iconSlotRoot}[data-status='draft'] svg`, {
  vars: {'--icon-color': 'var(--card-badge-caution-dot-color)'},
})

globalStyle(`${iconSlotRoot}[data-status='variant'] svg`, {
  vars: {'--icon-color': 'var(--card-badge-suggest-dot-color)'},
})

globalStyle(`${iconSlotRoot} svg`, {
  flexShrink: 0,
})
