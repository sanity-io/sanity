import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const toggleLayerVisibleVar = createVar()

export const toggleLayerButton = style({
  vars: {
    '--card-fg-color': 'inherit',
    '--card-icon-color': 'inherit',
  },
  backgroundColor: 'inherit',
  opacity: toggleLayerVisibleVar,
  selectors: {
    '[data-ui="MenuItem"]:hover &': {
      opacity: '1',
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:not([data-disabled="true"]):hover': {
          vars: {
            '--card-fg-color': 'inherit',
            '--card-icon-color': 'inherit',
          },
        },
      },
    },
  },
})

export const iconWrapperBox = style({
  selectors: {
    '&&': {
      position: 'relative',
      zIndex: 1,
      borderRadius: '50%',
    },
  },
})

export const iconWrapperBoxVisible = style([iconWrapperBox, {
  selectors: {
    '&&': {
      opacity: 1,
    },
  },
}])

export const iconWrapperBoxHidden = style([iconWrapperBox, {
  selectors: {
    '&&': {
      /* background-color: var(--card-background-color);  */
      opacity: 0,
    },
  },
}])

// The icon needs a white background to visually sit on top of the line indicator
globalStyle(`${iconWrapperBox} svg`, {
  backgroundColor: 'var(--card-bg-color)',
})
