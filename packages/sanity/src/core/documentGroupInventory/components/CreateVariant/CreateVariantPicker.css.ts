import {css} from '#styled-system/css'

/**
 * Note: this UI is based on other instances of filterable menus in the
 * codebase. This UI is likely to be refactored shortly, so it's not worth
 * establishing a new abstraction.
 */
export const createVariantPickerMenu = css({
  '&&&': {
    minWidth: 'min(280px, calc(100vw - 24px))',
    maxWidth: 'min(360px, calc(100vw - 24px))',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
    overflow: 'hidden',
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

/**
 * PROPOSED: the glyph of an empty select in the inset form is muted, whatever colour the glyph owns (a variant mark paints itself in the variant
 * tone; the spec wants `--card-muted-fg-color` on its colour, `--icon-color` and `--card-icon-color` until a variant is picked).
 */
export const finalMutedGlyph = css({
  '&&, && [data-ui="VariantMark"]': {
    'color': 'var(--card-muted-fg-color)',
    '--icon-color': 'var(--card-muted-fg-color)',
    '--card-icon-color': 'var(--card-muted-fg-color)',
  },
})

/**
 * PROPOSED: the menu of the inset form's selects is exactly as wide as its select (the popover matches the reference's width, as the reference
 * input's Autocomplete does), never wider, and capped in height so it does not run far past the form. The search field stays pinned above the scrolling list.
 */
export const createVariantPickerFitMenu = css({
  '&&&': {
    // As wide as its select, and never narrower than MIN = 280px (the smallest width that shows "Returning Female Visitors under 30" and the search field in full is 278px; a narrow select opens a MIN-wide menu from its left edge, extending right).
    minWidth: 'var(--create-variant-menu-min-width, 280px)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    maxHeight: '320px',
    overflow: 'hidden',
    // The popover is at least min-content wide; without this a long name or the search field's own width sets that minimum above the select's width.
    contain: 'inline-size',
  },
  // Every box in the menu may shrink below its content, so a long name truncates (MenuItem truncates its text) instead of widening the menu.
  '&&& *': {
    minWidth: 0,
  },
  '&&& [data-ui="MenuItem"]': {
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
