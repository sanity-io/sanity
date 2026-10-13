import {globalStyle, style, styleVariants} from '@vanilla-extract/css'

const INDICATOR_LEFT_OFFSET = 20
const INDICATOR_WIDTH = 1
const INDICATOR_COLOR_VAR_NAME = '--card-border-color'
const INDICATOR_BOTTOM_OFFSET = 4

export const menuItemIndicator = style({
  position: 'relative',
  vars: {
    '--indicator-left': `${INDICATOR_LEFT_OFFSET}px`,
    '--indicator-width': `${INDICATOR_WIDTH}px`,
    '--indicator-color': `var(${INDICATOR_COLOR_VAR_NAME})`,
    '--indicator-bottom': `${INDICATOR_BOTTOM_OFFSET}px`,
    '--indicator-in-range-height': '16.5px',
  },
})

// `$inRange && !$last`: the connector that continues below the item. The original template also
// declared `bottom: -var(--indicator-bottom)`, which is not valid CSS (`-var()` is not a function)
// and was dropped by the browser at parse time, so it is intentionally not reproduced here.
const menuItemIndicatorTail = {
  content: '""',
  display: 'block',
  position: 'absolute',
  left: 'var(--indicator-left)',
  width: 'var(--indicator-width)',
  backgroundColor: 'var(--card-border-color)',
} as const

/** Keyed by whether the item is the default perspective, which gets a longer tail. */
export const menuItemIndicatorInRangeTail = styleVariants({
  default: {
    selectors: {
      '&::after': {...menuItemIndicatorTail, height: 'calc(var(--indicator-bottom) + 12px)'},
    },
  },
  other: {
    selectors: {
      '&::after': {...menuItemIndicatorTail, height: 'var(--indicator-bottom)'},
    },
  },
})

export const menuItemIndicatorInRange = style({})

globalStyle(`${menuItemIndicatorInRange} > [data-ui='MenuItem']`, {
  position: 'relative',
})

globalStyle(
  `${menuItemIndicatorInRange} > [data-ui='MenuItem']::before, ${menuItemIndicatorInRange} > [data-ui='MenuItem']::after`,
  {
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 'var(--indicator-left)',
    width: 'var(--indicator-width)',
    backgroundColor: 'var(--card-border-color)',
  },
)

globalStyle(`${menuItemIndicatorInRange} > [data-ui='MenuItem']::before`, {
  top: 0,
  height: 'var(--indicator-in-range-height)',
})

globalStyle(`${menuItemIndicatorInRange} > [data-ui='MenuItem']::after`, {
  top: 'var(--indicator-in-range-height)',
  bottom: 0,
})

// `$first` / `$last` refine the in-range rules above at equal specificity, so they must stay
// defined after them in this file.
export const menuItemIndicatorFirst = style({})

globalStyle(`${menuItemIndicatorFirst} > [data-ui='MenuItem']::after`, {
  marginTop: '-3px',
  borderTopLeftRadius: `${INDICATOR_WIDTH}px`,
  borderTopRightRadius: `${INDICATOR_WIDTH}px`,
})

globalStyle(`${menuItemIndicatorFirst} > [data-ui='MenuItem']::before`, {
  display: 'none',
})

export const menuItemIndicatorLast = style({})

globalStyle(`${menuItemIndicatorLast} > [data-ui='MenuItem']::before`, {
  // dot diameter (5px) - 1.6px stroke divided by 2
  paddingBottom: '1.7px',
  borderBottomLeftRadius: `${INDICATOR_WIDTH}px`,
  borderBottomRightRadius: `${INDICATOR_WIDTH}px`,
})

globalStyle(`${menuItemIndicatorLast} > [data-ui='MenuItem']::after`, {
  display: 'none',
})

// The label is a ui5 Box rendered with `paddingLeft={2}`, whose `.sui-pl2` utility (0,1,0) lives in
// a static stylesheet with no guaranteed order relative to this one. The runtime-injected rule used
// to win that tie by insertion order; doubling the class wins it by specificity instead.
export const menuLabelIndicator = style({
  position: 'relative',
  selectors: {
    '&&': {
      // 4px padding + 33px release indicator width + 4px gap
      paddingLeft: '41px',
    },
  },
})

export const menuLabelIndicatorWithinRange = style({
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
