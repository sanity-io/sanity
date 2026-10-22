import {css} from '#styled-system/css'

/** `color.input.default.enabled.border` */
export const inputBorderColorVar = '--document-preview-input-border-color'

// Rendered through `<Text as={Link}>`, so Text's classes share this anchor; Text sets `color` and
// `& a` descendant rules only, none of which touch `text-decoration` on the root.
export const styledIntentLink = css({
  textDecoration: 'underline',
  textDecorationColor: `var(${inputBorderColorVar})`,
  textUnderlineOffset: '2px',
})
