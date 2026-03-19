import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const blendModeVar = createVar()
export const markerBgVar = createVar()
export const markersBgVar = createVar()
export const warningBorderVar = createVar()
export const warningBgVar = createVar()
export const errorBorderVar = createVar()
export const errorBgVar = createVar()
export const spaceVar = createVar()
export const radiusVar = createVar()
export const fontFamilyVar = createVar()
export const selectionBgVar = createVar()
export const textFlexPaddingVar = createVar()
export const blockActionsTopVar = createVar()
export const changeIndicatorWidthVar = createVar()
export const changeIndicatorPaddingLeftVar = createVar()
export const changeIndicatorPaddingRightVar = createVar()
export const numberCounterVar = createVar()
export const numberFormatVar = createVar()
export const bulletMarkerVar = createVar()

export const textRoot = style({
  vars: {
    '--marker-bg-color': 'transparent',
  },
  mixBlendMode: blendModeVar,
  position: 'relative',
  selectors: {
    '&[data-markers]': {
      vars: {
        '--marker-bg-color': markersBgVar,
      },
    },
    '&[data-warning]': {
      vars: {
        '--card-border-color': warningBorderVar,
        '--marker-bg-color': warningBgVar,
      },
    },
    '&[data-error]': {
      vars: {
        '--card-border-color': errorBorderVar,
        '--marker-bg-color': errorBgVar,
      },
    },
  },
})

globalStyle(`${textRoot} > [data-ui='TextBlock_inner']`, {
  position: 'relative',
  flex: 1,
})

globalStyle(`${textRoot} > div::before`, {
  content: "''",
  position: 'absolute',
  top: `calc(${spaceVar} * -1)`,
  bottom: `calc(${spaceVar} * -1)`,
  left: `calc(${spaceVar} * -1)`,
  right: `calc(${spaceVar} * -1)`,
  borderRadius: radiusVar,
  backgroundColor: 'var(--marker-bg-color)',
  zIndex: -1,
  pointerEvents: 'none',
})

globalStyle(`${textRoot} [data-list-prefix]`, {
  position: 'absolute',
  marginLeft: '-4.5rem',
  width: '3.75rem',
  textAlign: 'right',
  boxSizing: 'border-box',
})

globalStyle(`${textRoot}[data-list-item='number'] [data-list-prefix] > span::before`, {
  content: numberCounterVar,
  fontVariantNumeric: 'tabular-nums',
})

globalStyle(`${textRoot}[data-list-item='bullet'] [data-list-prefix] > span`, {
  position: 'relative',
  top: '-0.1875em',
})

globalStyle(`${textRoot}[data-list-item='bullet'] [data-list-prefix] > span::before`, {
  content: bulletMarkerVar,
  fontSize: '0.46666em',
})

globalStyle(`${textRoot} [data-text]`, {
  overflowWrap: 'anywhere',
  textTransform: 'none',
  whiteSpace: 'pre-wrap',
  fontFamily: fontFamilyVar,
  flex: 1,
})

globalStyle(`${textRoot} [data-text] *::selection`, {
  backgroundColor: selectionBgVar,
})

// TextBlockFlexWrapper
export const textBlockFlexWrapper = style({
  selectors: {
    '&&': {
      position: 'relative',
      display: 'flex',
    },
  },
})

export const listPrefixWrapper = style({
  userSelect: 'none',
  whiteSpace: 'nowrap',
})

export const blockActionsOuter = style({
  selectors: {
    '&&': {
      lineHeight: '0',
      width: '25px',
      position: 'relative',
    },
  },
})

export const blockActionsInner = style({
  selectors: {
    '&&': {
      userSelect: 'none',
      position: 'absolute',
      right: 0,
      top: blockActionsTopVar,
    },
  },
})

export const tooltipBox = style({
  selectors: {
    '&&': {
      maxWidth: '250px',
    },
  },
})

export const textFlex = style({
  selectors: {
    '&&': {
      position: 'relative',
      paddingLeft: textFlexPaddingVar,
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
