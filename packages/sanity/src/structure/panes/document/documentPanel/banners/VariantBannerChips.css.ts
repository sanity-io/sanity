import {css} from '#styled-system/css'

/** A type word and its chip ("variant [◆ Alpha]") are kept on one line. */
export const keep = css({
  whiteSpace: 'nowrap',
})

/** The variant's diamond, inside its chip and on the text line, a quarter em before the name. */
export const chipIcon = css({
  display: 'inline-block',
  verticalAlign: '-0.125em',
  marginInlineEnd: '0.25em',
})
