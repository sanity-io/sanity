import {globalStyle, style} from '@vanilla-extract/css'

export const formRowContainer = style({
  display: 'grid',
  gridTemplateAreas: "'gutterStart body gutterEnd'",
  gridTemplateColumns: 'var(--formGutterSize, 0px) 1fr var(--formGutterSize, 0px)',
  gap: 'var(--formGutterGap, 0px)',
})

/* Collapse the end gutter and gap for nested rows. */
globalStyle(`${formRowContainer} ${formRowContainer}`, {
  gridTemplateColumns: 'var(--formGutterSize, 0px) 1fr 0',
  marginInlineEnd: 'calc(var(--formGutterGap, 0px) * -1)',
})
