import {css} from '#styled-system/css'

/**
 * The space between a variant chip's diamond and its name. The inline chip sets no gap, since a
 * release's glyph carries its own space; the 8px diamond is drawn tip to tip and needs one.
 */
export const variantChipMark = css({
  marginInlineEnd: '4px',
})
