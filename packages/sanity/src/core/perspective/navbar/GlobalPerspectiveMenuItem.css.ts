import {css} from '#styled-system/css'

// Button (mode="bleed") sets `--card-fg-color`, `--card-icon-color` and `background-color` on its
// own class, and re-assigns the colour variables on `&:not([data-disabled='true']):hover`. The
// runtime-injected wrapper used to win those ties by insertion order; the doubled class wins them
// by specificity instead ((0,2,0) over (0,1,0), and (0,4,0) over (0,3,0) for the hover rule).
const toggleLayerButtonBase = css.raw({
  '&&': {
    '--card-fg-color': 'inherit',
    '--card-icon-color': 'inherit',
    'backgroundColor': 'inherit',
  },
  "[data-ui='MenuItem']:hover &": {
    opacity: 1,
  },
  '@media (hover: hover)': {
    "&&:not([data-disabled='true']):hover": {
      '--card-fg-color': 'inherit',
      '--card-icon-color': 'inherit',
    },
  },
})

/** Keyed by whether the layer is visible: the toggle for a visible layer only shows on hover. */
export const toggleLayerButton = {
  visible: css(toggleLayerButtonBase, {opacity: 0}),
  hidden: css(toggleLayerButtonBase, {opacity: 1}),
}

const iconWrapperBoxBase = css.raw({
  'position': 'relative',
  'zIndex': 1,
  'borderRadius': '50%',
  /* background-color: var(--card-background-color);  */
  // The icon needs a white background to visually sit on top of the line indicator
  '& svg': {
    backgroundColor: 'var(--card-bg-color)',
  },
})

/** Keyed by whether the layer is excluded from the perspective. */
export const iconWrapperBox = {
  excluded: css(iconWrapperBoxBase, {opacity: 0}),
  included: css(iconWrapperBoxBase, {opacity: 1}),
}
