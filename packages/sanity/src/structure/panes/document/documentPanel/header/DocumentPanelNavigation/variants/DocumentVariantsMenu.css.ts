import {css} from '#styled-system/css'

/**
 * Suggest-tone rhombus of the menu items. The menu item paints `[data-sanity-icon]` with
 * `var(--card-icon-color)`, so `&&` sets it on the svg itself.
 */
export const variantIcon = css({
  '&&': {
    '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
    '--icon-color': 'var(--card-badge-suggest-icon-color)',
  },
})

/** Hairline between the variants menu and the badges after it. */
export const menuDivider = css({
  width: '1px',
  alignSelf: 'stretch',
  marginInline: '8px',
  marginBlock: '6px',
  flexShrink: 0,
  backgroundColor: 'var(--card-border-color)',
})

/** The version count and its glyph at the end of a menu item. */
export const versionCount = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--card-muted-fg-color)',
})
