import {type ComplexStyleRule, style, styleVariants} from '@vanilla-extract/css'

import {type areas} from './FormRow.css'

/* Grid items default to `min-width: auto`; let the cell shrink below its content width. */
const cell = style({minWidth: 0})

export const formCell = styleVariants({
  gutterStart: [cell, {gridArea: 'gutterStart'}],
  body: [cell, {gridArea: 'body'}],
  gutterEnd: [cell, {gridArea: 'gutterEnd'}],
} satisfies Record<(typeof areas)[number], ComplexStyleRule>)
