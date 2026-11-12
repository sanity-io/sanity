import {css} from '#styled-system/css'

/** A title over its select, 8px apart, sharing one left edge. */
export const createVariantPickerField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
})

/**
 * The select, the size of the "Create variant definition" dialog's condition inputs: 13px text
 * in a 33px box, 12px in at the sides.
 */
export const createVariantPickerSelect = css({
  '&&': {
    width: '100%',
    minWidth: 0,
    height: '33px',
    paddingBlock: 0,
  },
  '&& > span': {
    paddingBlock: 0,
  },
})

/**
 * A glyph in the select keeps its natural size (15px) and is centred on the 13px text line. The
 * zero-high box with visible overflow keeps it from changing the select's height.
 */
const glyphBox = css.raw({
  display: 'inline-flex',
  flexShrink: 0,
  alignItems: 'center',
  height: 0,
  overflow: 'visible',
  fontSize: '15px',
  lineHeight: 0,
})

export const createVariantPickerGlyph = css(glyphBox)

/**
 * The glyph of an empty select, and the chevron, are muted, whatever colour the glyph owns. A
 * variant mark paints itself in the variant colour, so its colour variables are overridden too.
 */
export const createVariantPickerMutedGlyph = css(glyphBox, {
  '&&, && [data-ui="VariantMark"]': {
    'color': 'var(--card-muted-fg-color)',
    '--icon-color': 'var(--card-muted-fg-color)',
    '--card-icon-color': 'var(--card-muted-fg-color)',
  },
})

/**
 * The menu: as wide as its select, never narrower than `MIN_MENU_WIDTH` (set inline), at most
 * 320px high. The search field stays pinned above the list, which scrolls. Long names end in an
 * ellipsis instead of widening the menu.
 */
export const createVariantPickerMenu = css({
  '&&&': {
    maxWidth: 'calc(100vw - 24px)',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    maxHeight: '320px',
    overflow: 'hidden',
  },
  '&&& [data-ui="MenuItem"]': {
    minWidth: 0,
    maxWidth: '100%',
  },
  '&&& > [data-ui="Stack"]': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    gap: 0,
    overflow: 'hidden',
  },
})
