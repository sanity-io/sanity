import {createVar, style, styleVariants} from '@vanilla-extract/css'

/** `${maxWidth}px` — upper bound on the panel width */
export const propertiesCardMaxWidthVar = createVar()
/** `${titleTopLeading}px` — half-leading of the size-4 title, derived from the theme font metrics */
export const propertiesCardMarginTopVar = createVar()

// The panel sizes to its content (so a short two-row panel doesn't leave a wide empty gap) but never
// grows past a sensible max, at which point long values truncate instead of stretching the pane.
//
// margin-top drops the panel by the title's top half-leading so its top border lines up with the
// title's visible cap-height beside it (a text line-box is taller than its glyphs, so the title cap
// sits a few px below its layout top). Compensating on the panel — moving it down — rather than
// lifting the title up avoids clipping the title's caps under an overflow-hidden header.
export const propertiesCard = style({
  width: 'fit-content',
  maxWidth: propertiesCardMaxWidthVar,
  selectors: {
    // Card (Box) sets `margin: 0` on itself
    '&&': {
      marginTop: propertiesCardMarginTopVar,
    },
  },
})

// One grid per section so every row shares column tracks and stays aligned:
//  - glyph  (auto) — only present when the section has glyphs
//  - label  (max-content) — sizes to the widest label, so labels never truncate and values start on
//                           one clean left edge
//  - value  (minmax(0, 1fr)) — takes the rest; min-width:0 lets a long value truncate in its column
// grid-auto-rows keeps every row on an even minimum height, matching the old rhythm.
const sectionGridBase = style({
  display: 'grid',
  alignItems: 'center',
  columnGap: '12px',
  rowGap: '6px',
  gridAutoRows: 'minmax(25px, auto)',
})

export const sectionGrid = styleVariants({
  withGlyphs: [sectionGridBase, {gridTemplateColumns: 'auto max-content minmax(0, 1fr)'}],
  withoutGlyphs: [sectionGridBase, {gridTemplateColumns: 'max-content minmax(0, 1fr)'}],
})

export const glyphCell = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
})
