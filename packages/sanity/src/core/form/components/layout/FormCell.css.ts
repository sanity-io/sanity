import {type StyleRule, styleVariants} from '@vanilla-extract/css'

import {type areas} from './FormRow.css'

export const formCell = styleVariants({
  gutterStart: {gridArea: 'gutterStart'},
  body: {gridArea: 'body'},
  gutterEnd: {gridArea: 'gutterEnd'},
} satisfies Record<(typeof areas)[number], StyleRule>)
