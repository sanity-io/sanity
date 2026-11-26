import {css} from '#styled-system/css'

/**
 * The chips of the mark's tooltip. They keep the inline badge's colours and its square 3px corners
 * (a pill would look clickable), but sit on the text line as a flex row, so the glyph and the name
 * share a vertical centre, with a little more room inside than the inline badge has.
 *
 * An inline flex box takes its baseline from its first item. In the Draft, Published and release
 * chips that item is the glyph, which has no text, so the chip lined up by the glyph's bottom edge
 * and sat about 2px higher than the plain Default chip, on a taller line. Aligning every chip by its
 * middle instead puts them all on one centre line, whatever comes first inside them.
 */
export const chip = css({
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  gap: '4px',
  paddingBlock: '2px',
  paddingInline: '6px',
})

/**
 * The mark's button, drawn as the bare icon it was before: no chrome, and a focus ring that follows the
 * icon so a keyboard user can see where focus is.
 */
export const markButton = css({
  'position': 'relative',
  'display': 'inline-flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  // A 24x24 box in the layout whatever the glyph's size (WCAG 2.5.8), so the field title row keeps
  // its height. The drawn rhombus is smaller.
  'minWidth': '24px',
  'minHeight': '24px',
  // The pointer target reaches 32x32 past that box, so the tooltip is easy to reach with a mouse
  // without moving anything around the mark.
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '-4px',
    borderRadius: '50%',
  },
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
