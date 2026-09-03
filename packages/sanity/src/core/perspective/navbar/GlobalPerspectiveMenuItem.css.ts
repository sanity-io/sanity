import {globalStyle, style, styleVariants} from '@vanilla-extract/css'

// Button (mode="bleed") sets `--card-fg-color`, `--card-icon-color` and `background-color` on its
// own class, and re-assigns the colour variables on `&:not([data-disabled='true']):hover`. The
// runtime-injected wrapper used to win those ties by insertion order; the doubled class wins them
// by specificity instead ((0,2,0) over (0,1,0), and (0,4,0) over (0,3,0) for the hover rule).
const toggleLayerButtonBase = style({
  'selectors': {
    '&&': {
      vars: {
        '--card-fg-color': 'inherit',
        '--card-icon-color': 'inherit',
      },
      backgroundColor: 'inherit',
    },
    "[data-ui='MenuItem']:hover &": {
      opacity: 1,
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        "&&:not([data-disabled='true']):hover": {
          vars: {
            '--card-fg-color': 'inherit',
            '--card-icon-color': 'inherit',
          },
        },
      },
    },
  },
})

/** Keyed by whether the layer is visible: the toggle for a visible layer only shows on hover. */
export const toggleLayerButton = styleVariants({visible: 0, hidden: 1}, (opacity) => [
  toggleLayerButtonBase,
  {opacity},
])

const iconWrapperBoxBase = style({
  position: 'relative',
  zIndex: 1,
  borderRadius: '50%',
  /* background-color: var(--card-background-color);  */
})

/** Keyed by whether the layer is excluded from the perspective. */
export const iconWrapperBox = styleVariants({excluded: 0, included: 1}, (opacity) => [
  iconWrapperBoxBase,
  {opacity},
])

// The icon needs a white background to visually sit on top of the line indicator
globalStyle(`${iconWrapperBoxBase} svg`, {
  backgroundColor: 'var(--card-bg-color)',
})
