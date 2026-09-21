import {createVar, style} from '@vanilla-extract/css'

/** `font.text.family` */
export const descriptionFontFamilyVar = createVar()
/** `${font.text.sizes[2].fontSize}px` */
export const descriptionFontSizeVar = createVar()
/** `${font.text.sizes[2].lineHeight}px` */
export const descriptionLineHeightVar = createVar()

// Bounded, four-line description: title + up to four lines makes the identity block sit at (and
// never exceed) the height of the properties panel beside it, so the top band is one even zone.
// Full text lives in the hover tooltip; maxWidth keeps the line length fixed rather than stretching
// across the whole pane.
//
// This is a plain div rather than @sanity/ui <Text> on purpose: <Text> forces its own
// `display` (flow-root), which defeats `-webkit-line-clamp` (that needs display:-webkit-box) and
// collapses the box, clipping the first line. Owning the element lets the clamp work correctly.
export const clampedDescription = style({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: '4',
  overflow: 'hidden',
  maxWidth: '560px',
  margin: 0,
  fontFamily: descriptionFontFamilyVar,
  fontSize: descriptionFontSizeVar,
  lineHeight: descriptionLineHeightVar,
  color: 'var(--card-muted-fg-color)',
})
