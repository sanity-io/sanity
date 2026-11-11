import {css} from '#styled-system/css'

/**
 * The box the diamond is drawn in. It is flex-centred and trimmed vertically (`-0.375rem`
 * either side, as the ui5 `Icon` boxes next to text are), so it centres on its line or row
 * without a wrapper and without growing it.
 *
 * Resting colour is the variant (suggest) purple. Inside a selected or checked item it takes
 * the item's own text colour instead: the `:where()` contexts add no specificity, so the
 * doubled class (`&&`) is what lets them beat the resting colour.
 */
export const variantMark = css({
  'display': 'inline-flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'flexShrink': 0,
  'boxSizing': 'content-box',
  'height': '1.25rem',
  'marginBlock': '-0.375rem',
  'color': 'var(--card-badge-suggest-icon-color)',
  'lineHeight': 0,
  '&& > svg': {
    display: 'block',
    width: '100%',
    height: '100%',
    overflow: 'visible',
  },
  ':where([data-selected], [data-ui="MenuItem"][data-selected], :has(:checked)) &&': {
    color: 'inherit',
  },
})

/** Tip to tip. */
export const inlineSize = css({width: '8px'})

/** Tip to tip: a hair larger than inline so a leading mark carries the weight of a row. */
export const rowSize = css({width: '9.2px'})
