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

/**
 * The mark's button, drawn as the bare icon it was before: no chrome, and a focus ring that follows the
 * icon so a keyboard user can see where focus is.
 */
export const markButton = css({
  'display': 'inline-flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  // A 24x24 target whatever the glyph's size (WCAG 2.5.8): the drawn rhombus can be smaller.
  'minWidth': '24px',
  'minHeight': '24px',
  'padding': 0,
  'border': 0,
  'background': 'transparent',
  'color': 'inherit',
  'cursor': 'default',
  'borderRadius': '50%',
  '&:focus-visible': {
    outline: '2px solid var(--card-focus-ring-color, currentColor)',
    outlineOffset: '1px',
  },
})
