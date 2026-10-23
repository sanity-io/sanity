import {css} from '#styled-system/css'

import {formGutterCustomProperties} from './formGutterCustomProperties.css'

export const areas = ['gutterStart', 'body', 'gutterEnd'] as const

export const formRowContainer = css(formGutterCustomProperties, {
  'display': 'grid',
  // `areas`, joined
  'gridTemplateAreas': "'gutterStart body gutterEnd'",
  'gridTemplateColumns': 'var(--formGutterSize) 1fr var(--formGutterSize)',
  'gap': 'var(--formGutterGap)',
  /* Collapse the end gutter and gap for nested rows. */
  '& &': {
    gridTemplateColumns: 'var(--formGutterSize) 1fr 0',
    marginInlineEnd: 'calc(var(--formGutterGap) * -1)',
  },
})
