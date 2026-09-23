import {style} from '@vanilla-extract/css'

import {formGutterCustomProperties} from './formGutterCustomProperties.css'

export const areas = ['gutterStart', 'body', 'gutterEnd'] as const

export const formRowContainer = style([
  formGutterCustomProperties,
  {
    display: 'grid',
    gridTemplateAreas: `'${areas.join(' ')}'`,
    gridTemplateColumns: 'var(--formGutterSize) 1fr var(--formGutterSize)',
    gap: 'var(--formGutterGap)',
    selectors: {
      /* Collapse the end gutter and gap for nested rows. */
      '& &': {
        gridTemplateColumns: 'var(--formGutterSize) 1fr 0',
        marginInlineEnd: 'calc(var(--formGutterGap) * -1)',
      },
    },
  },
])
