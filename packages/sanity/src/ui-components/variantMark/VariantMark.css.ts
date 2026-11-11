import {css} from '#styled-system/css'

/**
 * The box the diamond is drawn in. It is flex-centred and trimmed vertically (`-0.375rem`
 * either side, as the ui5 `Icon` boxes next to text are), so it centres on its line or row
 * without a wrapper and without growing it.
 *
 * Resting colour is the variant (suggest) purple. Inside a selected or checked item it takes
 * the item's own text colour instead. A menu item's ui5 `Icon` clones the mark with its own
 * class, which paints `var(--icon-color)`, so the colour is set both as `color` and as
 * `--icon-color` / `--card-icon-color`, with the doubled class (`&&`) beating that class. The
 * `:where()` contexts add no specificity, so the selected rule uses three classes to beat the
 * resting one. A checked row is the item that holds the checkbox as a direct child, or one marked
 * `aria-checked`: a bare `:has(:checked)` would also match every ancestor of the row.
 */
export const variantMark = css({
  '&&': {
    'display': 'inline-flex',
    'alignItems': 'center',
    'justifyContent': 'center',
    'flexShrink': 0,
    'boxSizing': 'content-box',
    'height': '1.25rem',
    'marginBlock': '-0.375rem',
    'lineHeight': 0,
    'verticalAlign': '-0.41em',
    'color': 'var(--card-badge-suggest-icon-color)',
    '--icon-color': 'var(--card-badge-suggest-icon-color)',
    '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
  },
  '&& > svg': {
    display: 'block',
    width: '100%',
    height: '100%',
    overflow: 'visible',
  },
  ':where([data-selected], [data-ui="MenuItem"][data-selected], [aria-checked="true"], :has(> input:checked), [data-variant-name]:has(input:checked)) &&&':
    {
      'color': 'var(--card-fg-color)',
      '--icon-color': 'var(--card-fg-color)',
      '--card-icon-color': 'var(--card-fg-color)',
    },
})

/** Tip to tip. */
export const inlineSize = css({width: '8px'})

/**
 * Tip to tip: a hair larger than inline so a leading mark carries the weight of a row.
 *
 * The box is as wide as the 1em glyph box it replaces (the diamond is 9.2px of 21px), so a
 * menu item's icon slot, which lays out its own icon, keeps the diamond's left inset. A mark in a
 * leading column of its own trims that box to the glyph by passing
 * `style={{marginInline: '-0.375rem'}}`, as the ui5 `Icon` boxes there did.
 */
export const rowSize = css({
  '&&': {
    width: '21px',
  },
  // `margin-inline: auto` centres the diamond in the box even when a menu item's ui5 `Icon`
  // clone turns the box to `display: block` (it is a flex box otherwise)
  '&&& > svg': {
    width: '9.2px',
    marginInline: 'auto',
  },
})
