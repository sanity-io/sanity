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
  // On the selected fill (the selected variant, or the row under the pointer or keyboard focus)
  // the diamond takes the row's text colour, as in the navbar variants menu
  '[data-selected] &&': {
    '--card-icon-color': 'var(--card-fg-color)',
    '--icon-color': 'var(--card-fg-color)',
  },
})

/**
 * The diamond on the variants pill. While a variant is selected it takes the pill's label colour,
 * the tone's selected foreground, so the diamond, label and × match. At rest it keeps the
 * variant colour. Three classes beat the button's icon rule.
 */
export const pillVariantIcon = css({
  '&&&': {
    '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
  },
  '[data-selected] &&&': {
    '--card-icon-color': 'var(--card-fg-color)',
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
