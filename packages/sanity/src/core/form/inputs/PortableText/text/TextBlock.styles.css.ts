import {createVar, globalStyle, style, styleVariants} from '@vanilla-extract/css'

import {DEBUG} from '../../../../changeIndicators/constants'
import {TEXT_BULLET_MARKERS, TEXT_LEVELS, TEXT_NUMBER_FORMATS} from './constants'
import {createListName} from './helpers'

export const space1Var = createVar()
export const space2Var = createVar()
export const radius2Var = createVar()
/** `color._dark ? 'screen' : 'multiply'` */
export const blendModeVar = createVar()
/** `color._dark ? hues.purple[950].hex : hues.purple[50].hex` */
export const markersBgColorVar = createVar()
/** `color.button.ghost.caution.enabled.border` */
export const warningBorderColorVar = createVar()
/** `color.button.ghost.caution.hovered.bg` */
export const warningBgColorVar = createVar()
/** `color.button.ghost.critical.enabled.border` */
export const errorBorderColorVar = createVar()
/** `color.button.ghost.critical.hovered.bg` */
export const errorBgColorVar = createVar()
/** `font.text.family` */
export const fontFamilyVar = createVar()
/** `rgba(color.focusRing, 0.3)` */
export const selectionBgColorVar = createVar()
/** `BlockActionsInner`: `0 - (buttonHeight - capHeight2) / 2` in px, derived from `font.text.sizes` and `space[2]` */
export const blockActionsTopVar = createVar()
/** `TextFlex`: `$level ? $level * 32 : 0` in px */
export const listPaddingLeftVar = createVar()

/** Set on the root, read by the `::before` overlay of its first-level `div` (transparent unless flagged) */
const markerBgColorVar = createVar()

export const textRoot = style({
  vars: {
    [markerBgColorVar]: 'transparent',
  },
  mixBlendMode: blendModeVar,
  position: 'relative',
  selectors: {
    '&[data-markers]': {
      vars: {
        [markerBgColorVar]: markersBgColorVar,
      },
    },
    '&[data-warning]': {
      vars: {
        '--card-border-color': warningBorderColorVar,
        [markerBgColorVar]: warningBgColorVar,
      },
    },
    '&[data-error]': {
      vars: {
        '--card-border-color': errorBorderColorVar,
        [markerBgColorVar]: errorBgColorVar,
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
  top: `calc(-1 * ${space1Var})`,
  bottom: `calc(-1 * ${space1Var})`,
  left: `calc(-1 * ${space1Var})`,
  right: `calc(-1 * ${space1Var})`,
  borderRadius: radius2Var,
  backgroundColor: markerBgColorVar,
  // This is to make sure the marker is always behind the text
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

globalStyle(`${textRoot}[data-list-item='number'] [data-list-prefix]`, {
  fontVariantNumeric: 'tabular-nums',
})

globalStyle(`${textRoot}[data-list-item='bullet'] [data-list-prefix] > span`, {
  position: 'relative',
  top: '-0.1875em',
})

globalStyle(`${textRoot} [data-text]`, {
  overflowWrap: 'anywhere',
  textTransform: 'none',
  whiteSpace: 'pre-wrap',
  fontFamily: fontFamilyVar,
  flex: 1,
})

globalStyle(`${textRoot} [data-text] *::selection`, {
  backgroundColor: selectionBgColorVar,
})

/**
 * One marker class per list level (`$level`, clamped to `TEXT_LEVELS` by the editor). It carries
 * the level's counter and bullet marker for the list prefix, which live on a descendant `span`.
 */
export const textRootLevel = styleVariants(
  Object.fromEntries(TEXT_LEVELS.map((level) => [level, {}])),
)

for (const level of TEXT_LEVELS) {
  const numberMarker = TEXT_NUMBER_FORMATS[(level - 1) % TEXT_NUMBER_FORMATS.length]
  const bulletMarker = TEXT_BULLET_MARKERS[(level - 1) % TEXT_BULLET_MARKERS.length]

  globalStyle(
    `${textRootLevel[level]}[data-list-item='number'] [data-list-prefix] > span::before`,
    {
      content: [
        `counter(${createListName(level)}) '.'`,
        `counter(${createListName(level)}, ${numberMarker}) '.'`,
      ],
    },
  )

  globalStyle(
    `${textRootLevel[level]}[data-list-item='bullet'] [data-list-prefix] > span::before`,
    {
      content: `'${bulletMarker}'`,
      fontSize: '0.46666em',
    },
  )
}

export const textBlockWrapper = style({
  position: 'relative',
})

export const listPrefixWrapper = style({
  userSelect: 'none',
  whiteSpace: 'nowrap',
})

export const blockActionsOuter = style({
  lineHeight: 0,
  width: '25px',
  position: 'relative',
})

export const blockActionsInner = style({
  userSelect: 'none',
  position: 'absolute',
  right: 0,
  top: blockActionsTopVar,
})

export const tooltipBox = style({
  maxWidth: '250px',
})

export const textFlex = style({
  position: 'relative',
  selectors: {
    // Flex (Box) sets `padding: 0` on itself
    '&&': {
      paddingLeft: listPaddingLeftVar,
    },
  },
})

export const changeIndicatorWrapper = style({
  position: 'absolute',
  width: space2Var,
  right: 0,
  top: 0,
  bottom: 0,
  paddingLeft: space1Var,
  paddingRight: space2Var,
  userSelect: 'none',
  ...(DEBUG ? {border: '1px solid red'} : {}),
})

export const changeIndicatorWrapperHidden = style({
  display: 'none',
})
