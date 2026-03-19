import {createVar, globalStyle, style, styleVariants} from '@vanilla-extract/css'

const INDICATOR_LEFT_OFFSET = 20
const INDICATOR_WIDTH = 1
const INDICATOR_COLOR_VAR_NAME = '--card-border-color'
const INDICATOR_BOTTOM_OFFSET = 4

export const menuItemIndicatorBase = style({
  position: 'relative',
  vars: {
    '--indicator-left': `${INDICATOR_LEFT_OFFSET}px`,
    '--indicator-width': `${INDICATOR_WIDTH}px`,
    '--indicator-color': `var(${INDICATOR_COLOR_VAR_NAME})`,
    '--indicator-bottom': `${INDICATOR_BOTTOM_OFFSET}px`,
    '--indicator-in-range-height': '16.5px',
  },
})

// After pseudo-element for in-range items (not last)
export const inRangeAfter = style({
  selectors: {
    '&::after': {
      content: '""',
      display: 'block',
      position: 'absolute',
      left: 'var(--indicator-left)',
      bottom: 'calc(-1 * var(--indicator-bottom))',
      width: 'var(--indicator-width)',
      height: 'var(--indicator-bottom)',
      backgroundColor: 'var(--card-border-color)',
    },
  },
})

export const inRangeAfterDefault = style({
  selectors: {
    '&::after': {
      content: '""',
      display: 'block',
      position: 'absolute',
      left: 'var(--indicator-left)',
      bottom: 'calc(-1 * var(--indicator-bottom))',
      width: 'var(--indicator-width)',
      height: 'calc(var(--indicator-bottom) + 12px)',
      backgroundColor: 'var(--card-border-color)',
    },
  },
})

// In-range MenuItem before/after pseudo-elements
export const inRangeMenuItem = style({})

globalStyle(`${inRangeMenuItem} > [data-ui='MenuItem']`, {
  position: 'relative',
})

globalStyle(`${inRangeMenuItem} > [data-ui='MenuItem']::before, ${inRangeMenuItem} > [data-ui='MenuItem']::after`, {
  content: '""',
  display: 'block',
  position: 'absolute',
  left: 'var(--indicator-left)',
  width: 'var(--indicator-width)',
  backgroundColor: 'var(--card-border-color)',
})

globalStyle(`${inRangeMenuItem} > [data-ui='MenuItem']::before`, {
  top: 0,
  height: 'var(--indicator-in-range-height)',
})

globalStyle(`${inRangeMenuItem} > [data-ui='MenuItem']::after`, {
  top: 'var(--indicator-in-range-height)',
  bottom: 0,
})

// First position
export const firstPosition = style({})

globalStyle(`${firstPosition} > [data-ui='MenuItem']::after`, {
  marginTop: '-3px',
  borderTopLeftRadius: `${INDICATOR_WIDTH}px`,
  borderTopRightRadius: `${INDICATOR_WIDTH}px`,
})

globalStyle(`${firstPosition} > [data-ui='MenuItem']::before`, {
  display: 'none',
})

// Last position
export const lastPosition = style({})

globalStyle(`${lastPosition} > [data-ui='MenuItem']::before`, {
  // dot diameter (5px) - 1.6px stroke divided by 2
  paddingBottom: '1.7px',
  borderBottomLeftRadius: `${INDICATOR_WIDTH}px`,
  borderBottomRightRadius: `${INDICATOR_WIDTH}px`,
})

globalStyle(`${lastPosition} > [data-ui='MenuItem']::after`, {
  display: 'none',
})

// Label indicator
export const labelIndicatorBase = style({
  selectors: {
    '&&': {
      position: 'relative',
      // 4px padding + 33px release indicator width + 4px gap
      paddingLeft: '41px',
    },
  },
})

export const labelIndicatorWithinRange = style({
  selectors: {
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      left: `${INDICATOR_LEFT_OFFSET}px`,
      top: '-8px',
      bottom: `-${INDICATOR_BOTTOM_OFFSET}px`,
      width: `${INDICATOR_WIDTH}px`,
      backgroundColor: `var(${INDICATOR_COLOR_VAR_NAME})`,
    },
  },
})
