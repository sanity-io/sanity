import {createVar, style, type StyleRule} from '@vanilla-extract/css'

import {DEBUG} from '../../../../changeIndicators/constants'

export const space1Var = createVar()
export const space2Var = createVar()
export const radius1Var = createVar()
export const radius2Var = createVar()
/** `color._dark ? 'screen' : 'multiply'` */
export const overlayBlendModeVar = createVar()
/** `color._dark ? hues.purple[950].hex : hues.purple[50].hex` */
export const markersBgColorVar = createVar()
/** `color.button.ghost.caution.hovered.bg` (the legacy theme's `color.muted.caution.hovered.bg`) */
export const warningBgColorVar = createVar()
/** `color.button.ghost.caution.hovered.border` (the legacy theme's `color.muted.caution.hovered.border`) */
export const warningBorderColorVar = createVar()
/** `color.input.invalid.enabled.bg` */
export const invalidBgColorVar = createVar()
/** `color.input.invalid.hovered.border` */
export const invalidBorderColorVar = createVar()
/** `color.input.default.hovered.border` */
export const hoveredBorderColorVar = createVar()

const overlay: StyleRule = {
  pointerEvents: 'none',
  content: "''",
  position: 'absolute',
  top: `calc(-1 * ${space1Var})`,
  bottom: `calc(-1 * ${space1Var})`,
  left: `calc(-1 * ${space1Var})`,
  right: `calc(-1 * ${space1Var})`,
  borderRadius: radius2Var,
  mixBlendMode: overlayBlendModeVar,
}

export const root = style({
  'boxShadow': '0 0 0 1px var(--card-border-color)',
  'pointerEvents': 'all',
  'position': 'relative',
  'selectors': {
    // Card sets `border-radius` on itself
    '&&': {
      borderRadius: radius1Var,
    },
    '&[data-focused]': {
      vars: {
        '--card-border-color': 'var(--card-focus-ring-color)',
      },
    },
    '&[data-markers]:after': {
      ...overlay,
      backgroundColor: markersBgColorVar,
    },
    '&[data-warning]:after': {
      ...overlay,
      backgroundColor: warningBgColorVar,
    },
    '&[data-invalid]:after': {
      ...overlay,
      backgroundColor: invalidBgColorVar,
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:not([data-focused]):not([data-selected]):hover': {
          vars: {
            '--card-border-color': hoveredBorderColorVar,
          },
        },
        '&[data-warning]:hover': {
          vars: {
            '--card-border-color': warningBorderColorVar,
          },
        },
        '&[data-invalid]:hover': {
          vars: {
            '--card-border-color': invalidBorderColorVar,
          },
        },
      },
    },
  },
})

export const previewContainer = style({
  // Copied from the styled(Flex) rule; the Flex's own display rule (ui5's
  // `.sui-display-flex:not([hidden])`, (0,2,0)) outranked it before the migration too, so the
  // element stays a flex container.
  display: 'block',
  position: 'relative',
  width: '100%',
  userSelect: 'none',
  pointerEvents: 'all',
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
  selectors: {
    '[data-dragged] &': {
      visibility: 'hidden',
    },
  },
})

export const changeIndicatorWrapperHidden = style({
  display: 'none',
})

export const blockActionsOuter = style({
  width: '25px',
  position: 'relative',
  flexShrink: 0,
  userSelect: 'none',
  selectors: {
    '[data-dragged] &': {
      visibility: 'hidden',
    },
  },
})

export const blockActionsInner = style({
  position: 'absolute',
  right: 0,
  selectors: {
    '[data-dragged] &': {
      visibility: 'hidden',
    },
  },
})

export const tooltipBox = style({
  maxWidth: '250px',
})
