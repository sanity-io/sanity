import {style} from '@vanilla-extract/css'

export const errorIcon = style({
  vars: {
    '--card-icon-color': 'var(--card-badge-critical-icon-color)',
  },
})

export const warningIcon = style({
  vars: {
    '--card-icon-color': 'var(--card-badge-caution-icon-color)',
  },
})

export const infoIcon = style({
  vars: {
    '--card-icon-color': 'var(--card-badge-primary-icon-color)',
  },
})
