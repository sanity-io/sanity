import {css} from '#styled-system/css'

/** `font.text.family` */
export const descriptionFontFamilyVar = '--detail-identity-description-font-family'
/** `${font.text.sizes[2].fontSize}px` */
export const descriptionFontSizeVar = '--detail-identity-description-font-size'
/** `${font.text.sizes[2].lineHeight}px` */
export const descriptionLineHeightVar = '--detail-identity-description-line-height'

// csstype marks `-webkit-box-orient` obsolete, but `-webkit-line-clamp` only clamps together with
// `display: -webkit-box` and this declaration (same as DetailPreview.css.ts)
const webkitBoxOrientVertical = {WebkitBoxOrient: 'vertical'} as const

// Bounded, four-line description: title + up to four lines makes the identity block sit at (and
// never exceed) the height of the properties panel beside it, so the top band is one even zone.
// Full text lives in the hover tooltip; maxWidth keeps the line length fixed rather than stretching
// across the whole pane.
//
// This is a plain div rather than @sanity/ui <Text> on purpose: <Text> forces its own
// `display` (flow-root), which defeats `-webkit-line-clamp` (that needs display:-webkit-box) and
// collapses the box, clipping the first line. Owning the element lets the clamp work correctly.
export const clampedDescription = css({
  display: '[-webkit-box]',
  ...webkitBoxOrientVertical,
  WebkitLineClamp: '4',
  overflow: 'hidden',
  maxWidth: '560px',
  margin: 0,
  fontFamily: `var(${descriptionFontFamilyVar})`,
  fontSize: `var(${descriptionFontSizeVar})`,
  lineHeight: `var(${descriptionLineHeightVar})`,
  color: 'var(--card-muted-fg-color)',
})
