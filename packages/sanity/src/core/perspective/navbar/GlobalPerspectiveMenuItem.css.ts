import {globalStyle, style, styleVariants} from '@vanilla-extract/css'

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
