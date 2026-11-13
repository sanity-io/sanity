import {css} from '#styled-system/css'

/**
 * The variant's diamond at the inline size: 8px tip to tip (the 9.2px size is for row-leading marks).
 * The rhombus's tips span 7.9 of the viewBox's 18 units, so an 18.26px box draws 8px; the box is
 * trimmed to the glyph (-5.13px a side, 4px kept before the name) and centred on the text.
 */
export const chipIcon = css({
  display: 'inline-block',
  fontSize: '1.1413rem',
  margin: '-0.3206rem',
  marginInlineEnd: '-0.0706rem',
  verticalAlign: 'middle',
  position: 'relative',
  top: '-0.0625rem',
})
