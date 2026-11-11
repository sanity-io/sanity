import {css} from '#styled-system/css'

/** A type word and its chip ("variant [◆ Alpha]") are kept on one line. */
export const keep = css({
  whiteSpace: 'nowrap',
})

/** The variant chip lays its diamond and name on one centre line, same padding as the other chips. */
export const variantChip = css({
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'baseline',
})

/**
 * The variant's diamond: the large rhombus (9.2px tip to tip) in a 21px box trimmed to the glyph,
 * as the inventory rows draw it, so it is centred on the text and no smaller than the header
 * pill's diamond.
 */
export const chipIcon = css({
  flex: 'none',
  fontSize: '1.3125rem',
  margin: '-0.375rem',
  marginInlineEnd: '-0.125rem',
})
