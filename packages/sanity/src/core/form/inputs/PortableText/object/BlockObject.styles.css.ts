import {css} from '#styled-system/css'
import {type SystemStyleObject} from '#styled-system/types'

import {DEBUG} from '../../../../changeIndicators/constants'

export const space1Var = '--block-object-space-1'
export const space2Var = '--block-object-space-2'
export const radius1Var = '--block-object-radius-1'
export const radius2Var = '--block-object-radius-2'
/** `color._dark ? 'screen' : 'multiply'` */
export const overlayBlendModeVar = '--block-object-overlay-blend-mode'
/** `color._dark ? hues.purple[950].hex : hues.purple[50].hex` */
export const markersBgColorVar = '--block-object-markers-bg-color'
/** `color.button.ghost.caution.hovered.bg` (the legacy theme's `color.muted.caution.hovered.bg`) */
export const warningBgColorVar = '--block-object-warning-bg-color'
/** `color.button.ghost.caution.hovered.border` (the legacy theme's `color.muted.caution.hovered.border`) */
export const warningBorderColorVar = '--block-object-warning-border-color'
/** `color.input.invalid.enabled.bg` */
export const invalidBgColorVar = '--block-object-invalid-bg-color'
/** `color.input.invalid.hovered.border` */
export const invalidBorderColorVar = '--block-object-invalid-border-color'
/** `color.input.default.hovered.border` */
export const hoveredBorderColorVar = '--block-object-hovered-border-color'

const overlay = css.raw({
  pointerEvents: 'none',
  content: "''",
  position: 'absolute',
  top: `calc(-1 * var(${space1Var}))`,
  bottom: `calc(-1 * var(${space1Var}))`,
  left: `calc(-1 * var(${space1Var}))`,
  right: `calc(-1 * var(${space1Var}))`,
  borderRadius: `var(${radius2Var})`,
  mixBlendMode: `[var(${overlayBlendModeVar})]`,
})

export const root = css({
  'pointerEvents': 'all',
  'position': 'relative',
  // Card sets `border-radius` and `box-shadow` on itself
  '&&': {
    borderRadius: `var(${radius1Var})`,
    boxShadow: '0 0 0 1px var(--card-border-color)',
  },
  '&[data-focused]': {
    '--card-border-color': 'var(--card-focus-ring-color)',
  },
  // Being invalid wins over a warning, and both over the custom markers; `:where()` keeps the
  // specificity of each rule as it was
  '&[data-markers]:where(:not([data-warning], [data-invalid])):after': {
    ...overlay,
    backgroundColor: `var(${markersBgColorVar})`,
  },
  '&[data-warning]:where(:not([data-invalid])):after': {
    ...overlay,
    backgroundColor: `var(${warningBgColorVar})`,
  },
  '&[data-invalid]:after': {
    ...overlay,
    backgroundColor: `var(${invalidBgColorVar})`,
  },
  '@media (hover: hover)': {
    '&:not([data-focused]):not([data-selected]):hover': {
      '--card-border-color': `var(${hoveredBorderColorVar})`,
    },
    '&[data-warning]:where(:not([data-invalid])):hover': {
      '--card-border-color': `var(${warningBorderColorVar})`,
    },
    '&[data-invalid]:hover': {
      '--card-border-color': `var(${invalidBorderColorVar})`,
    },
  },
})

export const previewContainer = css({
  // Copied from the styled(Flex) rule; the Flex's own display rule (ui5's
  // `.sui-display-flex:not([hidden])`, (0,2,0)) outranked it before the migration too, so the
  // element stays a flex container.
  display: 'block',
  position: 'relative',
  width: '100%',
  userSelect: 'none',
  pointerEvents: 'all',
})

export const changeIndicatorWrapper = css({
  'position': 'absolute',
  'width': `var(${space2Var})`,
  'right': 0,
  'top': 0,
  'bottom': 0,
  'paddingLeft': `var(${space1Var})`,
  'paddingRight': `var(${space2Var})`,
  'userSelect': 'none',
  ...(DEBUG ? {border: '1px solid red'} : {}),
  '[data-dragged] &': {
    visibility: 'hidden',
  },
})

export const changeIndicatorWrapperHidden = css({
  display: 'none',
})

export const blockActionsOuter = css({
  'width': '25px',
  'position': 'relative',
  'flexShrink': 0,
  'userSelect': 'none',
  '[data-dragged] &': {
    visibility: 'hidden',
  },
})

export const blockActionsInner = css({
  'position': 'absolute',
  'right': 0,
  '[data-dragged] &': {
    visibility: 'hidden',
  },
})

export const tooltipBox = css({
  maxWidth: '250px',
})
