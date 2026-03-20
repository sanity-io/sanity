import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const fgColorVar = createVar()
export const minHeightVar = createVar()
export const transformVar = createVar()

export const contextMenuBox = style({
  '@media': {
    '(hover: hover)': {
      opacity: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      transform: transformVar,
    },
  },
})

export const timeText = style({
  selectors: {
    '&&': {
      minWidth: 'max-content',
      color: fgColorVar,
    },
  },
  vars: {
    '--card-fg-color': fgColorVar,
  },
})

export const headerFlex = style({
  selectors: {
    '&&': {
      minHeight: minHeightVar,
    },
  },
})

export const intentText = style({
  selectors: {
    '&&': {
      color: fgColorVar,
    },
  },
  vars: {
    '--card-fg-color': fgColorVar,
  },
})

export const innerStack = style({
  transition: 'opacity 200ms ease',
  selectors: {
    '&[data-muted="true"]': {
      transition: 'unset',
      opacity: 0.5,
    },
  },
})

export const errorFlex = style({
  selectors: {
    '&&': {
      minHeight: minHeightVar,
    },
  },
})

export const retryCardButton = style({
  selectors: {
    /* Add not on hover */
    '&&:not(:hover)': {
      backgroundColor: 'transparent',
    },
  },
})

export const rootStack = style({
  selectors: {
    '&&': {
      position: 'relative',
    },
  },
})

// Focus-within always shows the context menu
globalStyle(`${contextMenuBox}:focus-within`, {
  opacity: 1,
})

// Hover on root shows context menu
globalStyle(`${rootStack}:hover ${contextMenuBox}`, {
  opacity: 1,
})

// When menu is open, always show
globalStyle(`${rootStack}[data-menu-open="true"] ${contextMenuBox}`, {
  opacity: 1,
})
