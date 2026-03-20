import {style} from '@vanilla-extract/css'

export const iconTextInfo = style({
  vars: {
    '--card-fg-color': 'var(--card-muted-primary-enabled-fg-color, inherit)',
  },
})

export const iconTextWarning = style({
  vars: {
    '--card-fg-color': 'var(--card-muted-caution-enabled-fg-color, inherit)',
  },
})

export const iconTextError = style({
  vars: {
    '--card-fg-color': 'var(--card-muted-critical-enabled-fg-color, inherit)',
  },
})
