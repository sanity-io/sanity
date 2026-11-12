import {css} from '#styled-system/css'

/**
 * The chips of the mark's tooltip. They keep the inline badge's colours and its square 3px corners
 * (a pill would look clickable), but sit on the text line as a flex row, so the glyph and the name
 * share a vertical centre, with a little more room inside than the inline badge has.
 */
export const chip = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  paddingBlock: '2px',
  paddingInline: '6px',
})

/**
 * A glyph before a chip's name. The release avatar draws a block svg and trims it with an inline
 * negative margin, which leaves a margin box about as small as the glyph. This box centres that
 * margin box on the chip's text line. The chip used to fake the line position with a scale and a
 * vertical-align offset, and the dot rendered raised, like a superscript asterisk.
 */
export const chipGlyph = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  width: '1em',
  height: '1em',
})
