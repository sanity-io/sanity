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

/**
 * The cropped viewBox draws the glyph larger than the chip's icon slot, so it
 * sits 2px closer to the label. The button's icon rule is a class plus
 * `[data-sanity-icon]` (0,2,0) and is injected later, so two classes only tie
 * it. Three classes win.
 */
export const rhombusIconLarge = css({
  '&&&': {
    marginRight: '-2px',
  },
})
