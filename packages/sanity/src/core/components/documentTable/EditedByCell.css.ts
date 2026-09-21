import {style} from '@vanilla-extract/css'

// container-query wrapper: show the editor's name when the cell has room, collapse to just the
// avatar when the column is squeezed narrow. The avatar always carries the name in its tooltip, so
// nothing is lost when the label is hidden. `width: 100%` is required: `container-type: inline-size`
// imposes size containment, so without a definite width the element collapses to ~0 (a shrink-to-fit
// flex item derives no intrinsic width once contained) and the query would report "narrow" always.
export const cellRoot = style({
  containerType: 'inline-size',
  width: '100%',
  selectors: {
    // Flex (Box) sets `min-width: 0` on itself
    '&&': {
      minWidth: 0,
    },
  },
})

// Kept at single-class specificity like the styled(Text) rule it replaces: Text's own
// `&:not([hidden]) {display: block}` (0,2,0) outranks it, so the outcome is unchanged.
export const nameText = style({
  'minWidth': 0,
  '@container': {
    '(max-width: 108px)': {
      display: 'none',
    },
  },
})
