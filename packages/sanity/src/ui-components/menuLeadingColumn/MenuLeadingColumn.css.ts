import {css} from '#styled-system/css'

/**
 * The leading column of a menu row: a 21px box, the width of the glyph box a `MenuItem`'s `icon`
 * slot draws, so a row that lays out its own leading glyph lines up with the rows that use the
 * slot. The glyph is centred in the box across and along it.
 *
 * Glyphs trim their own box (ui5 `Icon` with a `-0.375rem` margin), so they overflow the box
 * evenly on every side rather than leaving it off-centre.
 */
export const menuLeadingColumn = css({
  display: 'flex',
  flex: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  width: '21px',
  // The glyph's box height, so a column in a row of its own text lines sits on the first line
  height: '21px',
})
