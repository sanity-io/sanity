import {createVar, style} from '@vanilla-extract/css'

/** `color.input.default.enabled.border` */
export const inputBorderColorVar = createVar()

// Rendered through `<Text as={Link}>`, so Text's classes share this anchor; Text sets `color` and
// `& a` descendant rules only, none of which touch `text-decoration` on the root.
export const styledIntentLink = style({
  textDecoration: 'underline',
  textDecorationColor: inputBorderColorVar,
  textUnderlineOffset: '2px',
})
