import {css} from '#styled-system/css'

/**
 * Suggest-tone glyph. ui5 `Icon` paints `var(--icon-color)` and redeclares that
 * variable on the svg (`.sui-Icon` wins over an ancestor), so `&&` sets it on
 * the element. The navbar chip is a v4 button, which paints `[data-sanity-icon]`
 * with `var(--card-icon-color)`.
 */
export const suggestIconColor = css({
  '&&': {
    '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
    '--icon-color': 'var(--card-badge-suggest-icon-color)',
  },
})

/** Spacer to align section headers with menu item icons. */
export const menuIconSpacer = css({
  width: 15,
})
