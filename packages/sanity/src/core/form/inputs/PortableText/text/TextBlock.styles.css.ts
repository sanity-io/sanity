import {css, firstThatWorks} from '#styled-system/css'

import {DEBUG} from '../../../../changeIndicators/constants'

export const space1Var = '--text-block-space-1'
export const space2Var = '--text-block-space-2'
export const radius2Var = '--text-block-radius-2'
/** `color._dark ? 'screen' : 'multiply'` */
export const blendModeVar = '--text-block-blend-mode'
/** `color._dark ? hues.purple[950].hex : hues.purple[50].hex` */
export const markersBgColorVar = '--text-block-markers-bg-color'
/** `color.button.ghost.caution.enabled.border` */
export const warningBorderColorVar = '--text-block-warning-border-color'
/** `color.button.ghost.caution.hovered.bg` */
export const warningBgColorVar = '--text-block-warning-bg-color'
/** `color.button.ghost.critical.enabled.border` */
export const errorBorderColorVar = '--text-block-error-border-color'
/** `color.button.ghost.critical.hovered.bg` */
export const errorBgColorVar = '--text-block-error-bg-color'
/** `font.text.family` */
export const fontFamilyVar = '--text-block-font-family'
/** `rgba(color.focusRing, 0.3)` */
export const selectionBgColorVar = '--text-block-selection-bg-color'
/** `BlockActionsInner`: `0 - (buttonHeight - capHeight2) / 2` in px, derived from `font.text.sizes` and `space[2]` */
export const blockActionsTopVar = '--text-block-actions-top'
/** `TextFlex`: `$level ? $level * 32 : 0` in px */
export const listPaddingLeftVar = '--text-block-list-padding-left'

/** Set on the root, read by the `::before` overlay of its first-level `div` (transparent unless flagged) */
const markerBgColorVar = '--text-block-marker-bg-color'

export const textRoot = css({
  [markerBgColorVar]: 'transparent',
  'mixBlendMode': `[var(${blendModeVar})]`,
  'position': 'relative',
  // An error wins over a warning, and both over the custom markers; `:where()` keeps the
  // specificity of each rule as it was
  '&[data-markers]:where(:not([data-warning], [data-error]))': {
    [markerBgColorVar]: `var(${markersBgColorVar})`,
  },
  '&[data-warning]:where(:not([data-error]))': {
    '--card-border-color': `var(${warningBorderColorVar})`,
    [markerBgColorVar]: `var(${warningBgColorVar})`,
  },
  '&[data-error]': {
    '--card-border-color': `var(${errorBorderColorVar})`,
    [markerBgColorVar]: `var(${errorBgColorVar})`,
  },
  "& > [data-ui='TextBlock_inner']": {
    position: 'relative',
    flex: 1,
  },
  '& > div::before': {
    content: "''",
    position: 'absolute',
    top: `calc(-1 * var(${space1Var}))`,
    bottom: `calc(-1 * var(${space1Var}))`,
    left: `calc(-1 * var(${space1Var}))`,
    right: `calc(-1 * var(${space1Var}))`,
    borderRadius: `var(${radius2Var})`,
    backgroundColor: `var(${markerBgColorVar})`,
    // This is to make sure the marker is always behind the text
    zIndex: -1,
    pointerEvents: 'none',
  },
  '& [data-list-prefix]': {
    position: 'absolute',
    marginLeft: '-4.5rem',
    width: '3.75rem',
    textAlign: 'right',
    boxSizing: 'border-box',
  },
  "&[data-list-item='number'] [data-list-prefix]": {
    fontVariantNumeric: 'tabular-nums',
  },
  "&[data-list-item='bullet'] [data-list-prefix] > span": {
    position: 'relative',
    top: '-0.1875em',
  },
  '& [data-text]': {
    overflowWrap: 'anywhere',
    textTransform: 'none',
    whiteSpace: 'pre-wrap',
    fontFamily: `var(${fontFamilyVar})`,
    flex: 1,
  },
  '& [data-text] *::selection': {
    backgroundColor: `var(${selectionBgColorVar})`,
  },
})

/**
 * One class per list level (`$level`, clamped to `TEXT_LEVELS` by the editor). It carries the
 * level's counter (`createListName(level)`) and the level's `TEXT_NUMBER_FORMATS` and
 * `TEXT_BULLET_MARKERS` entry for the list prefix, which lives on a descendant `span`. Each level
 * is spelled out, rather than mapped over, so the calls stay statically extractable.
 */
export const textRootLevel: Record<number, string> = {
  1: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks("counter(list-level-1, number) '.'", "counter(list-level-1) '.'"),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'●'",
      fontSize: '0.46666em',
    },
  }),
  2: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks(
        "counter(list-level-2, lower-alpha) '.'",
        "counter(list-level-2) '.'",
      ),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'○'",
      fontSize: '0.46666em',
    },
  }),
  3: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks(
        "counter(list-level-3, lower-roman) '.'",
        "counter(list-level-3) '.'",
      ),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'■'",
      fontSize: '0.46666em',
    },
  }),
  4: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks("counter(list-level-4, number) '.'", "counter(list-level-4) '.'"),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'●'",
      fontSize: '0.46666em',
    },
  }),
  5: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks(
        "counter(list-level-5, lower-alpha) '.'",
        "counter(list-level-5) '.'",
      ),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'○'",
      fontSize: '0.46666em',
    },
  }),
  6: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks(
        "counter(list-level-6, lower-roman) '.'",
        "counter(list-level-6) '.'",
      ),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'■'",
      fontSize: '0.46666em',
    },
  }),
  7: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks("counter(list-level-7, number) '.'", "counter(list-level-7) '.'"),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'●'",
      fontSize: '0.46666em',
    },
  }),
  8: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks(
        "counter(list-level-8, lower-alpha) '.'",
        "counter(list-level-8) '.'",
      ),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'○'",
      fontSize: '0.46666em',
    },
  }),
  9: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks(
        "counter(list-level-9, lower-roman) '.'",
        "counter(list-level-9) '.'",
      ),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'■'",
      fontSize: '0.46666em',
    },
  }),
  10: css({
    "&[data-list-item='number'] [data-list-prefix] > span::before": {
      content: firstThatWorks("counter(list-level-10, number) '.'", "counter(list-level-10) '.'"),
    },
    "&[data-list-item='bullet'] [data-list-prefix] > span::before": {
      content: "'●'",
      fontSize: '0.46666em',
    },
  }),
}

export const textBlockWrapper = css({
  position: 'relative',
})

export const listPrefixWrapper = css({
  userSelect: 'none',
  whiteSpace: 'nowrap',
})

export const blockActionsOuter = css({
  lineHeight: 0,
  width: '25px',
  position: 'relative',
})

export const blockActionsInner = css({
  userSelect: 'none',
  position: 'absolute',
  right: 0,
  top: `var(${blockActionsTopVar})`,
})

export const tooltipBox = css({
  maxWidth: '250px',
})

export const textFlex = css({
  'position': 'relative',
  // Flex (Box) sets `padding: 0` on itself
  '&&': {
    paddingLeft: `var(${listPaddingLeftVar})`,
  },
})

export const changeIndicatorWrapper = css({
  position: 'absolute',
  width: `var(${space2Var})`,
  right: 0,
  top: 0,
  bottom: 0,
  paddingLeft: `var(${space1Var})`,
  paddingRight: `var(${space2Var})`,
  userSelect: 'none',
  ...(DEBUG ? {border: '1px solid red'} : {}),
})

export const changeIndicatorWrapperHidden = css({
  display: 'none',
})
