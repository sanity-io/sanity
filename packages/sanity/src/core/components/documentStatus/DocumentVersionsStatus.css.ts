import {style} from '@vanilla-extract/css'

export const versionStatusTitles = style({
  flex: '0 1 auto',
  minWidth: 0,
})

export const variantIconCard = style({
  vars: {
    '--card-icon-color': 'var(--card-accent-fg-color)',
  },
  backgroundColor: 'transparent',
})
