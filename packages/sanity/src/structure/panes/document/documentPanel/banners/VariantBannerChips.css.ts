import {css} from '#styled-system/css'

/**
 * The variant's diamond: the large rhombus (9.2px tip to tip) in a 21px box trimmed to the glyph,
 * as the inventory rows draw it, so it is no smaller than the header pill's diamond. It sits inline
 * and centred on the text (cap height), so the chip's text stays on the line's baseline.
 */
export const chipIcon = css({
  display: 'inline-block',
  fontSize: '1.3125rem',
  margin: '-0.375rem',
  marginInlineEnd: '-0.125rem',
  verticalAlign: 'middle',
  position: 'relative',
  top: '-0.0625rem',
})
