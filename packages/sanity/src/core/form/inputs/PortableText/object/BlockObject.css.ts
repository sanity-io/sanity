import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const overlayTopVar = createVar()
export const overlayBottomVar = createVar()
export const overlayLeftVar = createVar()
export const overlayRightVar = createVar()
export const overlayRadiusVar = createVar()
export const overlayBlendModeVar = createVar()
export const borderRadiusVar = createVar()
export const hoveredBorderColorVar = createVar()
export const markersBgVar = createVar()
export const warningBgVar = createVar()
export const warningHoverBorderVar = createVar()
export const invalidBgVar = createVar()
export const invalidHoverBorderVar = createVar()
export const changeIndicatorWidthVar = createVar()
export const changeIndicatorPaddingLeftVar = createVar()
export const changeIndicatorPaddingRightVar = createVar()

export const root = style({
  selectors: {
    '&&': {
      boxShadow: '0 0 0 1px var(--card-border-color)',
      borderRadius: borderRadiusVar,
      pointerEvents: 'all',
      position: 'relative',
    },
    '&&[data-focused]': {
      vars: {
        '--card-border-color': 'var(--card-focus-ring-color)',
      },
    },
  },
})

globalStyle(`${root}:not([data-focused]):not([data-selected]):hover`, {
  '@media': {
    '(hover: hover)': {
      vars: {
        '--card-border-color': hoveredBorderColorVar,
      },
    },
  },
})

globalStyle(`${root}[data-markers]::after`, {
  pointerEvents: 'none',
  content: "''",
  position: 'absolute',
  top: overlayTopVar,
  bottom: overlayBottomVar,
  left: overlayLeftVar,
  right: overlayRightVar,
  borderRadius: overlayRadiusVar,
  mixBlendMode: overlayBlendModeVar,
  backgroundColor: markersBgVar,
})

globalStyle(`${root}[data-warning]::after`, {
  pointerEvents: 'none',
  content: "''",
  position: 'absolute',
  top: overlayTopVar,
  bottom: overlayBottomVar,
  left: overlayLeftVar,
  right: overlayRightVar,
  borderRadius: overlayRadiusVar,
  mixBlendMode: overlayBlendModeVar,
  backgroundColor: warningBgVar,
})

globalStyle(`${root}[data-warning]:hover`, {
  '@media': {
    '(hover: hover)': {
      vars: {
        '--card-border-color': warningHoverBorderVar,
      },
    },
  },
})

globalStyle(`${root}[data-invalid]::after`, {
  pointerEvents: 'none',
  content: "''",
  position: 'absolute',
  top: overlayTopVar,
  bottom: overlayBottomVar,
  left: overlayLeftVar,
  right: overlayRightVar,
  borderRadius: overlayRadiusVar,
  mixBlendMode: overlayBlendModeVar,
  backgroundColor: invalidBgVar,
})

globalStyle(`${root}[data-invalid]:hover`, {
  '@media': {
    '(hover: hover)': {
      vars: {
        '--card-border-color': invalidHoverBorderVar,
      },
    },
  },
})

export const previewContainer = style({
  selectors: {
    '&&': {
      display: 'block',
      position: 'relative',
      width: '100%',
      userSelect: 'none',
      pointerEvents: 'all',
    },
  },
})

export const changeIndicatorWrapper = style({
  position: 'absolute',
  width: changeIndicatorWidthVar,
  right: 0,
  top: 0,
  bottom: 0,
  paddingLeft: changeIndicatorPaddingLeftVar,
  paddingRight: changeIndicatorPaddingRightVar,
  userSelect: 'none',
})

export const changeIndicatorHidden = style({
  display: 'none',
})

export const innerFlex = style({
  selectors: {
    '&&': {
      position: 'relative',
    },
  },
})

globalStyle(`[data-dragged] ${innerFlex}`, {
  opacity: 0.5,
})

export const blockActionsOuter = style({
  selectors: {
    '&&': {
      width: '25px',
      position: 'relative',
      flexShrink: 0,
      userSelect: 'none',
    },
  },
})

globalStyle(`[data-dragged] ${blockActionsOuter}`, {
  visibility: 'hidden',
})

export const blockActionsInner = style({
  selectors: {
    '&&': {
      position: 'absolute',
      right: 0,
    },
  },
})

globalStyle(`[data-dragged] ${blockActionsInner}`, {
  visibility: 'hidden',
})

export const tooltipBox = style({
  selectors: {
    '&&': {
      maxWidth: '250px',
    },
  },
})
